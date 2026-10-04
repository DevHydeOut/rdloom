import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Everything the CLI reads and writes in a user's project, plus the registry.

export interface RegistryFile {
  path: string; // relative to componentsDir; "@tokens" targets config.tokensCss
  type: string;
  content: string;
}
export interface RegistryItem {
  name: string;
  type: string;
  version: string;
  description: string;
  dependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
}
export interface Config {
  componentsDir: string;
  tokensCss: string;
  /** Namespaces for GitHub registries: { "@acme": "acme/design-system" }. */
  registries?: Record<string, string>;
}
export interface LockItem {
  version: string;
  /** Hash of each file exactly as shipped, keyed by registry path. */
  files: Record<string, string>;
  /** npm dependencies of the installed version (added in lock v2). */
  dependencies?: string[];
  /** For GitHub registry items: where it came from and the commit installed. */
  source?: string;
  sha?: string;
}
export interface Lock {
  lockVersion?: number;
  items: Record<string, LockItem>;
}

export const CONFIG_FILE = "rdloom.json";
export const LOCK_FILE = "rdloom.lock.json";
/** Copies of each file as shipped: the merge base for `upgrade`. Commit it. */
export const BASE_DIR = ".rdloom/base";
export const DEFAULT_CONFIG: Config = {
  componentsDir: "src/components/rdloom",
  tokensCss: "src/styles/rdloom-tokens.css",
};

/** A user-facing failure: printed without a stack trace. */
export class CliError extends Error {}

/** "DataGrid", "data_grid" or "Data Grid" -> "data-grid", the registry's spelling. */
export const normalizeName = (name: string) =>
  name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]++;
    for (let j = 1; j <= b.length; j++) {
      const next = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = row[j];
      row[j] = next;
    }
  }
  return row[b.length];
}

/** The closest candidate, if it's close enough to be a likely typo. */
export function closest(input: string, candidates: string[]): string | undefined {
  const target = input.replace(/^-+/, "").toLowerCase();
  let best: string | undefined;
  let bestScore = Infinity;
  for (const c of candidates) {
    const score = c.includes(target) || target.includes(c) ? 0.5 : distance(target, c);
    if (score < bestScore) [best, bestScore] = [c, score];
  }
  return bestScore <= Math.max(2, Math.floor(target.length / 3)) ? best : undefined;
}

export const sha = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);

export function readJson<T>(file: string): T | undefined {
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as T) : undefined;
}

export function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

// --- Text files, keeping the user's line endings ---------------------------

export interface Text {
  /** Content with \n line endings, for comparing and merging. */
  text: string;
  eol: "\n" | "\r\n";
}

export function readText(file: string): Text | undefined {
  if (!fs.existsSync(file)) return undefined;
  const raw = fs.readFileSync(file, "utf8");
  return { text: raw.replace(/\r\n/g, "\n"), eol: raw.includes("\r\n") ? "\r\n" : "\n" };
}

export function writeText(file: string, text: string, eol: "\n" | "\r\n" = "\n") {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, eol === "\n" ? text : text.replace(/\n/g, "\r\n"));
}

// --- Registry ---------------------------------------------------------------

/**
 * The built-in registry (a folder of items) plus any remote items fetched for
 * this command (remote.ts), keyed by qualified name like "acme/ui/button".
 */
export class Registry {
  constructor(
    readonly dir: string,
    readonly remote: Map<string, RegistryItem> = new Map(),
  ) {}

  has(name: string) {
    return this.remote.has(name) || (!name.includes("/") && fs.existsSync(path.join(this.dir, `${name}.json`)));
  }

  item(name: string): RegistryItem {
    const remote = this.remote.get(name);
    if (remote) return remote;
    if (name.includes("/")) throw new CliError(`"${name}" wasn't fetched from its registry`);
    const item = readJson<RegistryItem>(path.join(this.dir, `${name}.json`));
    if (!item) {
      const guess = closest(name, this.index().map((i) => i.name));
      throw new CliError(
        `"${name}" is not in the registry.${guess ? ` Did you mean "${guess}"?` : ""} Run \`rdloom list\` to see what's available.`,
      );
    }
    return item;
  }

  index() {
    const index = readJson<{ items: Array<Pick<RegistryItem, "name" | "type" | "version" | "description">> }>(
      path.join(this.dir, "index.json"),
    );
    if (!index) throw new CliError(`registry not found at ${this.dir}`);
    return index.items;
  }

  /** The items plus everything they depend on, dependencies first, no duplicates. */
  resolve(names: string[]): RegistryItem[] {
    const ordered: RegistryItem[] = [];
    const seen = new Set<string>();
    const visit = (name: string) => {
      if (seen.has(name)) return;
      seen.add(name);
      const item = this.item(name);
      item.registryDependencies.forEach(visit);
      ordered.push(item);
    };
    names.forEach(visit);
    return ordered;
  }
}

// --- Project ----------------------------------------------------------------

/** The nearest directory at or above `from` that holds an rdloom.json. */
function findRoot(from: string): string | undefined {
  for (let dir = path.resolve(from); ; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, CONFIG_FILE))) return dir;
    if (dir === path.dirname(dir)) return undefined;
  }
}

/** Workspace directories (npm/yarn/pnpm globs like "apps/*") that hold an rdloom.json. */
export function workspaceProjects(root: string): string[] {
  const pkg = readJson<{ workspaces?: string[] | { packages?: string[] } }>(path.join(root, "package.json"));
  const yaml = readText(path.join(root, "pnpm-workspace.yaml"))?.text;
  const globs = Array.isArray(pkg?.workspaces)
    ? pkg.workspaces
    : (pkg?.workspaces?.packages ?? (yaml ? [...yaml.matchAll(/^\s*-\s*["']?([^"'\n]+)["']?/gm)].map((m) => m[1].trim()) : []));

  const found: string[] = [];
  for (const glob of globs) {
    // Only the common shapes: "apps/*", "packages/ui", "apps/**". Deeper globs are rare.
    const [prefix] = glob.split("*");
    const dir = path.join(root, prefix);
    const candidates = glob.includes("*")
      ? (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []).filter((e) => e.isDirectory()).map((e) => path.join(dir, e.name))
      : [dir];
    for (const c of candidates) if (fs.existsSync(path.join(c, CONFIG_FILE))) found.push(path.relative(root, c).replace(/\\/g, "/"));
  }
  return found.sort();
}

export class Project {
  /** Where rdloom.json, the lock file and .rdloom/ live: this directory or the nearest above it. */
  readonly root: string;

  constructor(readonly cwd: string) {
    this.root = findRoot(cwd) ?? cwd;
  }

  get configFile() {
    return path.join(this.root, CONFIG_FILE);
  }

  config(): Config {
    const config = readJson<Config>(this.configFile);
    if (config) return config;
    // In a monorepo the config usually sits in one workspace, not at the root.
    const elsewhere = workspaceProjects(this.cwd);
    if (elsewhere.length) {
      throw new CliError(
        `no ${CONFIG_FILE} here or above. This looks like a monorepo; rdloom is set up in: ${elsewhere.join(", ")}.\n` +
          `Run the command inside one (e.g. \`--cwd ${elsewhere[0]}\`), or \`rdloom init\` here to share components across workspaces.`,
      );
    }
    throw new CliError(`no ${CONFIG_FILE} here or above. Run \`rdloom init\` first.`);
  }

  lock(): Lock {
    return readJson<Lock>(path.join(this.root, LOCK_FILE)) ?? { lockVersion: 2, items: {} };
  }

  saveLock(lock: Lock) {
    writeJson(path.join(this.root, LOCK_FILE), { ...lock, lockVersion: 2 });
  }

  /** Where a registry file lives in the user's project. */
  target(file: string, config = this.config()): string {
    return file === "@tokens" ? path.join(this.root, config.tokensCss) : path.join(this.root, config.componentsDir, file);
  }

  /** Where the as-shipped copy of a registry file is kept. */
  base(file: string): string {
    return path.join(this.root, BASE_DIR, file === "@tokens" ? "@tokens.css" : file);
  }

  rel(abs: string) {
    return path.relative(this.root, abs).replace(/\\/g, "/");
  }
}
