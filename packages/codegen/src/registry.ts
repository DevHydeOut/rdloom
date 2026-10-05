import fs from "node:fs";
import path from "node:path";
import { brand } from "./brand.ts";
import { registryDir, root, tokensOutDir } from "./paths.ts";
import { buildShadcnRegistry } from "./shadcn.ts";
import { kebab, loadSpecs } from "./specs.ts";

// Registry items follow the shadcn registry-item shape (name, type,
// dependencies, registryDependencies, files[]) so the shadcn CLI can read them.
// `version` is our addition; the rdloom CLI uses it for diff/upgrade.

export interface RegistryFile {
  path: string; // relative to the user's componentsDir; "@tokens" targets config.tokensCss, "@motion" the motion CSS beside it
  type: "registry:ui" | "registry:lib" | "registry:style";
  content: string;
}

export interface RegistryItem {
  name: string;
  type: "registry:ui" | "registry:lib" | "registry:style";
  version: string;
  description: string;
  dependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
}

const reactSrc = path.join(root, "packages", "react", "src");
const reactPkg = JSON.parse(fs.readFileSync(path.join(root, "packages", "react", "package.json"), "utf8"));
// Only real import/export statements, so prose like `from "today"` in a comment doesn't count.
const IMPORT = /^\s*(?:import|export)\b[^;]*?\bfrom\s+["']([^"']+)["']/gm;
const BUILTIN_PEERS = new Set(["react", "react-dom"]);

function read(rel: string): string {
  return fs.readFileSync(path.join(reactSrc, rel), "utf8").replace(/\r\n/g, "\n");
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

/** npm packages (with version ranges) and local registry items a set of files imports. */
function scanImports(files: RegistryFile[]) {
  const npm = new Set<string>();
  const local = new Set<string>();
  for (const f of files) {
    for (const [, spec] of f.content.matchAll(IMPORT)) {
      // "../utils/x" -> the utils item; "../calendar/calendar" -> the calendar item.
      const sibling = spec.match(/^\.\.\/([a-z0-9-]+)\//)?.[1];
      if (sibling && sibling !== "generated") local.add(sibling);
      else if (!spec.startsWith(".")) {
        const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
        if (!BUILTIN_PEERS.has(pkg)) {
          const range = reactPkg.dependencies?.[pkg];
          npm.add(range ? `${pkg}@${range}` : pkg);
        }
      }
    }
  }
  return { npm: [...npm].sort(), local: [...local].sort() };
}

function utilsItem(): RegistryItem {
  const files = walk(path.join(reactSrc, "utils")).map((full) => {
    const rel = path.relative(reactSrc, full).replace(/\\/g, "/");
    return { path: rel, type: "registry:lib" as const, content: read(rel) };
  });
  return {
    name: "utils",
    type: "registry:lib",
    version: reactPkg.version,
    description: "Shared helpers used by components.",
    dependencies: scanImports(files).npm,
    registryDependencies: [],
    files,
  };
}

/**
 * The keyframes and still-motion rules behind the motion components. It is its own item, so it
 * is installed only when a motion component is, and the CLI imports it from the tokens file.
 */
function motionItem(): RegistryItem {
  return {
    name: "motion-css",
    type: "registry:style",
    version: reactPkg.version,
    description: "Keyframes and reduced-motion rules for the optional motion components.",
    dependencies: [],
    registryDependencies: [],
    files: [{ path: "@motion", type: "registry:style", content: read("motion/rdloom-motion.css") }],
  };
}

function tokensItem(): RegistryItem {
  return {
    name: "tokens",
    type: "registry:style",
    version: reactPkg.version,
    description: "Design tokens as CSS variables (light and dark).",
    dependencies: [],
    registryDependencies: [],
    files: [
      {
        path: "@tokens",
        type: "registry:style",
        content: fs.readFileSync(path.join(tokensOutDir, "tokens.css"), "utf8"),
      },
    ],
  };
}

/**
 * A dependency range tells users which versions work. Its floor must be at
 * least the version our tests run against: `^1.5.0` while testing 1.21 let
 * apps with 1.5 install components that don't compile.
 */
function checkDependencyFloors() {
  const problems: string[] = [];
  for (const [name, range] of Object.entries<string>(reactPkg.dependencies ?? {})) {
    if (name.startsWith(brand.npmScope)) continue;
    const floor = range.match(/^[\^~]?(\d+)\.(\d+)\.(\d+)/);
    let installed: string;
    try {
      installed = JSON.parse(fs.readFileSync(path.join(root, "node_modules", name, "package.json"), "utf8")).version;
    } catch {
      continue; // not installed here, nothing to compare against
    }
    const tested = installed.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!floor || !tested) continue;
    const [fMajor, fMinor] = [Number(floor[1]), Number(floor[2])];
    const [tMajor, tMinor] = [Number(tested[1]), Number(tested[2])];
    if (fMajor < tMajor || (fMajor === tMajor && fMinor < tMinor)) {
      problems.push(`${name}: declares "${range}" but tests run against ${installed}; raise the floor to "^${installed}"`);
    }
  }
  if (problems.length) {
    throw new Error(`Dependency ranges in packages/react/package.json are too loose:\n  ${problems.join("\n  ")}`);
  }
}

export function buildRegistry(): string[] {
  checkDependencyFloors();
  const items: RegistryItem[] = [utilsItem(), tokensItem(), motionItem()];

  for (const { spec } of loadSpecs()) {
    const id = kebab(spec.name);
    const componentDir = path.join(reactSrc, id);
    if (!fs.existsSync(componentDir)) {
      console.warn(`skip ${spec.name}: spec exists but packages/react/src/${id}/ does not`);
      continue;
    }
    const files: RegistryFile[] = [
      ...walk(componentDir).map((full) => {
        const rel = path.relative(reactSrc, full).replace(/\\/g, "/");
        return { path: rel, type: "registry:ui" as const, content: read(rel) };
      }),
      { path: `generated/${id}.types.ts`, type: "registry:ui", content: read(`generated/${id}.types.ts`) },
    ];
    const imports = scanImports(files);
    items.push({
      name: id,
      type: "registry:ui",
      version: spec.version,
      description: spec.description,
      dependencies: imports.npm,
      // Only the effects that use a motion class need the CSS: BlurFade and RevealButton are plain transitions.
      registryDependencies: ["tokens", ...(files.some((f) => /["' ]rdm-[a-z]/.test(f.content)) ? ["motion-css"] : []), ...imports.local],
      files,
    });
  }

  fs.mkdirSync(registryDir, { recursive: true });
  const written = items.map((item) => {
    const file = path.join(registryDir, `${item.name}.json`);
    fs.writeFileSync(file, JSON.stringify(item, null, 2) + "\n");
    return file;
  });

  const index = {
    name: brand.name,
    items: items.map(({ name, type, version, description }) => ({ name, type, version, description })),
  };
  const indexFile = path.join(registryDir, "index.json");
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2) + "\n");
  return [...written, indexFile, ...buildShadcnRegistry(items)];
}
