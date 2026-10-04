import fs from "node:fs";
import path from "node:path";
import { CliError, readJson, writeJson, type RegistryItem } from "./project.ts";

// For registry authors: `rdloom registry build` turns a manifest
// (rdloom-registry.json) that points at source files into the built items
// `rdloom add owner/repo/item` downloads. Commit the output folder too: the
// CLI reads built items straight from the repository.
//
// {
//   "name": "acme",
//   "output": "registry",
//   "items": [{
//     "name": "auth-kit", "version": "1.0.0", "description": "Sign-in form",
//     "dependencies": ["zod@^4"], "registryDependencies": ["button"],
//     "files": [{ "path": "auth/auth-kit.tsx", "source": "src/auth/auth-kit.tsx" }]
//   }]
// }
//
// `path` is where the file lands under the user's componentsDir; `source`
// (relative to the manifest, default: `path`) is where it lives in this repo.

export interface ManifestFile {
  path: string;
  source?: string;
  type?: string;
}

export interface ManifestItem {
  name: string;
  type?: string;
  version: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: ManifestFile[];
}

export interface Manifest {
  name: string;
  homepage?: string;
  output?: string;
  items?: ManifestItem[];
}

export const MANIFEST_FILE = "rdloom-registry.json";

const NAME = /^[a-z0-9][a-z0-9-]*$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/;
const NPM_DEP = /^(?:@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*(?:@[^\s]+)?$/i;
const QUALIFIED = /^(?:@[\w.-]+\/[\w.-]+|[\w.-]+\/[\w.-]+\/[\w.-]+)$/;

interface Loaded {
  file: string;
  dir: string;
  manifest: Manifest;
}

function load(cwd: string, manifestPath = MANIFEST_FILE): Loaded {
  const file = path.resolve(cwd, manifestPath);
  if (!fs.existsSync(file)) throw new CliError(`no ${path.relative(cwd, file) || manifestPath}. Create one (see \`rdloom help\`).`);
  let manifest: Manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    throw new CliError(`${path.relative(cwd, file)} is not valid JSON`);
  }
  return { file, dir: path.dirname(file), manifest };
}

const outputDir = ({ dir, manifest }: Loaded) => path.resolve(dir, manifest.output ?? "registry");
const sourceOf = (f: ManifestFile) => f.source ?? f.path;

/** Problems with the manifest, as readable strings. Empty means valid. */
export function checkManifest(loaded: Loaded, builtin: Set<string> = new Set()): string[] {
  const { dir, manifest } = loaded;
  const errors: string[] = [];
  if (!manifest.name || !NAME.test(manifest.name)) errors.push(`name: "${manifest.name ?? ""}" should be lowercase letters, numbers and dashes`);
  const out = path.relative(dir, outputDir(loaded));
  if (out.startsWith("..") || path.isAbsolute(out)) errors.push(`output: "${manifest.output}" must be inside the repository`);
  if (!manifest.items?.length) errors.push("items: add at least one item");

  const names = new Set<string>();
  for (const [i, item] of (manifest.items ?? []).entries()) {
    const at = `items[${i}]${item?.name ? ` (${item.name})` : ""}`;
    if (!item.name || !NAME.test(item.name)) errors.push(`${at}: name should be lowercase letters, numbers and dashes`);
    else if (names.has(item.name)) errors.push(`${at}: duplicate name`);
    names.add(item.name);
    if (!item.version || !SEMVER.test(item.version)) errors.push(`${at}: version "${item.version ?? ""}" should look like 1.0.0`);
    if (!item.description?.trim()) errors.push(`${at}: add a description`);
    for (const d of item.dependencies ?? []) if (!NPM_DEP.test(d)) errors.push(`${at}: dependency "${d}" isn't an npm package name`);
    if (!item.files?.length) errors.push(`${at}: add at least one file`);
    for (const f of item.files ?? []) {
      if (!f.path) {
        errors.push(`${at}: a file has no path`);
        continue;
      }
      if (f.path !== "@tokens" && (path.isAbsolute(f.path) || f.path.split(/[\\/]/).includes(".."))) {
        errors.push(`${at}: file path "${f.path}" must be relative, without ..`);
      }
      const src = path.resolve(dir, sourceOf(f));
      if (path.relative(dir, src).startsWith("..")) errors.push(`${at}: source "${sourceOf(f)}" must be inside the repository`);
      else if (!fs.existsSync(src)) errors.push(`${at}: source file ${sourceOf(f)} doesn't exist`);
    }
  }
  for (const item of manifest.items ?? []) {
    for (const d of item.registryDependencies ?? []) {
      if (!names.has(d) && !builtin.has(d) && !QUALIFIED.test(d)) {
        errors.push(`${item.name}: registryDependency "${d}" is neither in this registry, a built-in rdloom item, nor "owner/repo/item" / "@ns/item"`);
      }
    }
  }
  return errors;
}

function builtinNames(registryDir?: string): Set<string> {
  const index = registryDir ? readJson<{ items: Array<{ name: string }> }>(path.join(registryDir, "index.json")) : undefined;
  return new Set(index?.items.map((i) => i.name) ?? []);
}

export function validateRegistry(cwd: string, manifestPath: string | undefined, out: { info(m: string): void; warn(m: string): void }, registryDir?: string): boolean {
  const loaded = load(cwd, manifestPath);
  const errors = checkManifest(loaded, builtinNames(registryDir));
  const rel = path.relative(cwd, loaded.file) || MANIFEST_FILE;
  if (errors.length) {
    out.warn(`✗ ${rel}: ${errors.length} problem(s)`);
    for (const e of errors) out.warn(`  ${e}`);
    return false;
  }
  out.info(`✓ ${rel}: ${loaded.manifest.items!.length} item(s) look good`);
  return true;
}

export function buildRegistry(cwd: string, manifestPath: string | undefined, out: { info(m: string): void; warn(m: string): void }, registryDir?: string): string[] {
  const loaded = load(cwd, manifestPath);
  const errors = checkManifest(loaded, builtinNames(registryDir));
  if (errors.length) throw new CliError(`fix these first:\n  ${errors.join("\n  ")}`);

  const dir = outputDir(loaded);
  const written: string[] = [];
  for (const m of loaded.manifest.items!) {
    const item: RegistryItem = {
      name: m.name,
      type: m.type ?? "registry:ui",
      version: m.version,
      description: m.description,
      dependencies: m.dependencies ?? [],
      registryDependencies: m.registryDependencies ?? [],
      files: m.files.map((f) => ({
        path: f.path,
        type: f.type ?? m.type ?? "registry:ui",
        // LF endings: the CLI compares and merges line by line and keeps the user's own endings.
        content: fs.readFileSync(path.resolve(loaded.dir, sourceOf(f)), "utf8").replace(/\r\n/g, "\n"),
      })),
    };
    const file = path.join(dir, `${m.name}.json`);
    writeJson(file, item);
    written.push(file);
  }
  const index = path.join(dir, "index.json");
  writeJson(index, {
    name: loaded.manifest.name,
    homepage: loaded.manifest.homepage,
    items: loaded.manifest.items!.map(({ name, type, version, description }) => ({ name, type: type ?? "registry:ui", version, description })),
  });
  written.push(index);
  for (const f of written) out.info(`wrote ${path.relative(cwd, f).replace(/\\/g, "/")}`);
  out.info(`\nCommit ${path.relative(cwd, dir).replace(/\\/g, "/") || "."}/ too: \`rdloom add <owner>/<repo>/<item>\` reads the built items from GitHub.`);
  return written;
}
