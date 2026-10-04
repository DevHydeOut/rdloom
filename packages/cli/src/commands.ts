import { spawnSync, type StdioOptions } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createTwoFilesPatch } from "diff";
import { mergeDiff3 } from "node-diff3";
import {
  CliError,
  closest,
  CONFIG_FILE,
  normalizeName,
  DEFAULT_CONFIG,
  Project,
  readJson,
  readText,
  Registry,
  sha,
  writeJson,
  writeText,
  type Config,
  type LockItem,
  type Text,
} from "./project.ts";
import type { LoadedRemote } from "./remote.ts";
import { writeAgentFiles } from "./agents.ts";

export interface Output {
  info(message: string): void;
  warn(message: string): void;
}

export interface Context {
  cwd: string;
  registryDir: string;
  out: Output;
  /** Runs a command; injectable so tests never call npm. */
  run?: (cmd: string[], cwd: string) => number | null;
  /** GitHub registry items fetched for this command (index.ts, remote.ts). */
  remote?: LoadedRemote;
}

const registryOf = (ctx: Context) => new Registry(ctx.registryDir, ctx.remote?.items);

/** Built-in names in any case ("DataGrid"); GitHub names ("acme/ui/x", "@acme/x") as given. */
const localName = (name: string) => (name.includes("/") ? name : normalizeName(name));

/** Where a lock item came from, for GitHub registry items. */
const sourceOf = (ctx: Context, name: string): Pick<LockItem, "source" | "sha"> => {
  const s = ctx.remote?.sources.get(name);
  return s ? { source: s.id, sha: s.sha } : {};
};

// --- Package manager ---------------------------------------------------------

function detectPackageManager(cwd: string): string {
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(cwd, "bun.lockb")) || fs.existsSync(path.join(cwd, "bun.lock"))) return "bun";
  return "npm";
}

/**
 * Quotes an argument for display and for Windows' cmd.exe, where `^` is an
 * escape character: unquoted, `pkg@^1.2.0` turns into `pkg@1.2.0` and pins
 * the minimum version. Double quotes are safe in bash, zsh, PowerShell and cmd.
 */
const quoteArg = (arg: string) => (/[\s"^&|<>()%!]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg);
export const commandLine = (cmd: string[]) => cmd.map(quoteArg).join(" ");

/** `toStderr` keeps stdout clean for --json: the installer's output goes to stderr. */
export function runCommand(cmd: string[], cwd: string, toStderr = false): number | null {
  const stdio: StdioOptions = toStderr ? ["ignore", 2, 2] : "inherit";
  // Windows can only start npm/pnpm/yarn (.cmd shims) through a shell, so pass
  // one pre-quoted command line. Elsewhere, skip the shell entirely.
  const result =
    process.platform === "win32"
      ? spawnSync(commandLine(cmd), { cwd, stdio, shell: true })
      : spawnSync(cmd[0], cmd.slice(1), { cwd, stdio });
  return result.status;
}

function installDependencies(ctx: Context, deps: string[], install: boolean | undefined) {
  if (deps.length === 0) return;
  const pm = detectPackageManager(ctx.cwd);
  const cmd = pm === "npm" ? ["npm", "install", ...deps] : [pm, "add", ...deps];
  if (install) {
    ctx.out.info(`\n$ ${commandLine(cmd)}`);
    if ((ctx.run ?? runCommand)(cmd, ctx.cwd) !== 0) throw new CliError("dependency install failed");
  } else {
    ctx.out.info(`\nInstall dependencies:\n  ${commandLine(cmd)}`);
  }
}

// --- init --------------------------------------------------------------------

export function init(ctx: Context, opts: { componentsDir?: string; tokensCss?: string; agents?: boolean } = {}) {
  if (!fs.existsSync(path.join(ctx.cwd, "package.json"))) throw new CliError(`no package.json in ${ctx.cwd}`);
  // init always sets up *this* directory, even when a parent already has a config.
  const configFile = path.join(ctx.cwd, CONFIG_FILE);

  const existing = readJson<Config>(configFile);
  const config: Config = existing ?? {
    componentsDir: opts.componentsDir ?? DEFAULT_CONFIG.componentsDir,
    tokensCss: opts.tokensCss ?? DEFAULT_CONFIG.tokensCss,
  };
  if (existing) {
    ctx.out.info(`${CONFIG_FILE} already exists, keeping it`);
  } else {
    writeJson(configFile, config);
    ctx.out.info(`created ${CONFIG_FILE}`);
  }

  add(ctx, ["tokens", "utils"], { quiet: true });

  const agentFiles = opts.agents === false ? [] : writeAgentFiles(ctx.cwd, config);
  if (agentFiles.length) ctx.out.info(`updated ${agentFiles.join(", ")} (AI agent rules and MCP server; skip with --no-agents)`);

  const tokensImport = path.relative(path.join(ctx.cwd, "src"), path.join(ctx.cwd, config.tokensCss)).replace(/\\/g, "/");
  ctx.out.info(`
Next steps:
  1. Import the tokens once, e.g. in your root layout or global CSS:
       import "./${tokensImport}";
  2. Make sure Tailwind scans ${config.componentsDir}.
  3. Commit rdloom.json, rdloom.lock.json and .rdloom/ (the merge base for upgrades).
  4. Add components:  npx rdloom add button`);

  // A workspace root: one shared copy of the components beats one per app.
  const workspaceRoot = !existing && !opts.componentsDir && isWorkspaceRoot(ctx.cwd);
  if (workspaceRoot) {
    ctx.out.info(`
This looks like a monorepo root. Components now live in ${config.componentsDir}, shared by every
workspace. To keep them inside one package instead, re-run init there, or point it at that package:
  npx rdloom init --components-dir packages/ui/src/rdloom --tokens-css packages/ui/src/rdloom.css
Each app then imports the tokens CSS once, and Tailwind in each app needs @source for that folder.`);
  }
  return { config, agentFiles, workspaceRoot };
}

/** A package.json with workspaces, or a pnpm workspace file. */
function isWorkspaceRoot(dir: string): boolean {
  const pkg = readJson<{ workspaces?: unknown }>(path.join(dir, "package.json"));
  return !!pkg?.workspaces || fs.existsSync(path.join(dir, "pnpm-workspace.yaml"));
}

// --- add ---------------------------------------------------------------------

export interface AddOptions {
  overwrite?: boolean;
  install?: boolean;
  quiet?: boolean;
}

export function add(ctx: Context, requested: string[], opts: AddOptions = {}) {
  const names = requested.map(localName);
  if (names.length === 0) throw new CliError("name at least one component, e.g. `rdloom add button`");
  const project = new Project(ctx.cwd);
  const registry = registryOf(ctx);
  const config = project.config();
  const lock = project.lock();
  const deps = new Set<string>();
  const added: string[] = [];
  let skipped = 0;

  for (const item of registry.resolve(names)) {
    // Installed items are upgrade's job: re-adding a newer version here would
    // record it as the base while the user's file is still the old one.
    if (lock.items[item.name] && !opts.overwrite) {
      if (names.includes(item.name)) {
        ctx.out.info(`${item.name} ${lock.items[item.name].version} is already installed. Run \`rdloom upgrade ${item.name}\` to update it.`);
      }
      continue;
    }

    const hashes: Record<string, string> = {};
    for (const file of item.files) {
      const target = project.target(file.path, config);
      hashes[file.path] = sha(file.content);
      writeText(project.base(file.path), file.content);

      const local = readText(target);
      if (local?.text === file.content) continue;
      if (local && !opts.overwrite) {
        ctx.out.warn(`skip  ${project.rel(target)} (exists and differs; use --overwrite to replace)`);
        skipped++;
        continue;
      }
      writeText(target, file.content, local?.eol);
      ctx.out.info(`write ${project.rel(target)}`);
    }
    lock.items[item.name] = { version: item.version, files: hashes, dependencies: item.dependencies, ...sourceOf(ctx, item.name) };
    item.dependencies.forEach((d) => deps.add(d));
    added.push(item.name);
  }
  project.saveLock(lock);

  installDependencies(ctx, [...deps], opts.install);
  if (skipped > 0) ctx.out.warn(`\n${skipped} file(s) skipped because you've changed them.`);
  if (!opts.quiet && added.length) ctx.out.info(`\nAdded: ${added.join(", ")}`);
  return { added, skipped };
}

// --- list --------------------------------------------------------------------

export function list(ctx: Context) {
  const lock = new Project(ctx.cwd).lock();
  return registryOf(ctx)
    .index()
    .filter((i) => i.type === "registry:ui")
    .map((item) => {
      const installed = lock.items[item.name]?.version;
      const note = !installed ? "" : installed === item.version ? "  (installed)" : `  (installed ${installed})`;
      ctx.out.info(`${item.name.padEnd(20)} ${item.version.padEnd(8)} ${item.description}${note}`);
      return { name: item.name, version: item.version, description: item.description, installed: installed ?? null };
    });
}

// --- Planning: shared by diff and upgrade -------------------------------------

export type FileStatus =
  | "unchanged" //  same as shipped and as upstream
  | "modified" //   only you changed it: kept as is
  | "update" //     only upstream changed it: replaced
  | "merge" //      both changed it, different lines: merged
  | "conflict" //   both changed the same lines: conflict markers
  | "new" //        a file the new version adds
  | "removed" //    a file the new version no longer ships: your copy is kept
  | "missing" //    you deleted it: not restored
  | "no-base"; //   installed before merge bases existed and you changed it

export interface FilePlan {
  path: string;
  target: string;
  status: FileStatus;
  local?: Text;
  base?: string;
  upstream?: string;
  /** Merged content, for "merge" and "conflict" (with markers). */
  merged?: string;
}

export interface ItemPlan {
  name: string;
  from: string;
  to?: string; // undefined when the registry no longer has the item
  files: FilePlan[];
  newDependencies: string[];
  newItems: string[];
}

const lines = (s: string) => s.split("\n");

function planFile(project: Project, config: Config, lockItem: LockItem, filePath: string, upstream: string | undefined, toVersion: string): FilePlan {
  const target = project.target(filePath, config);
  const local = readText(target);
  const plan = (status: FileStatus, extra: Partial<FilePlan> = {}): FilePlan => ({ path: filePath, target, status, local, upstream, ...extra });

  if (upstream === undefined) return plan("removed");
  if (!(filePath in lockItem.files)) {
    if (!local || local.text === upstream) return plan(local ? "unchanged" : "new", { base: "" });
    // A file you created yourself where the new version wants to put one.
    const merged = mergeDiff3(lines(local.text), [], lines(upstream), labels(toVersion));
    return plan("conflict", { base: "", merged: merged.result.join("\n") });
  }
  if (!local) return plan("missing");

  let base = readText(project.base(filePath))?.text;
  if (base === undefined) {
    // Lock from before .rdloom/base existed: we know the hash, not the text.
    if (sha(local.text) !== lockItem.files[filePath]) return plan("no-base");
    base = local.text;
  }

  const mine = local.text !== base;
  const theirs = upstream !== base;
  if (!mine && !theirs) return plan("unchanged", { base });
  if (mine && !theirs) return plan("modified", { base });
  if (!mine && theirs) return plan("update", { base });
  if (local.text === upstream) return plan("unchanged", { base }); // same edit on both sides

  const merged = mergeDiff3(lines(local.text), lines(base), lines(upstream), labels(toVersion));
  return plan(merged.conflict ? "conflict" : "merge", { base, merged: merged.result.join("\n") });
}

const labels = (toVersion: string) => ({ label: { a: "yours", o: "base", b: `rdloom ${toVersion}` } });

function planItems(ctx: Context, requested: string[]): ItemPlan[] {
  const names = requested.map(localName);
  const project = new Project(ctx.cwd);
  const registry = registryOf(ctx);
  const config = project.config();
  const lock = project.lock();

  const installed = Object.keys(lock.items);
  if (installed.length === 0) throw new CliError("nothing installed yet. Run `rdloom add <component>` first.");
  const unknown = names.filter((n) => !lock.items[n]);
  if (unknown.length) {
    const guesses = unknown.map((n) => closest(n, installed)).filter(Boolean);
    const hint = guesses.length ? ` Did you mean ${guesses.map((g) => `"${g}"`).join(", ")}?` : "";
    throw new CliError(`not installed: ${unknown.join(", ")}.${hint} Installed: ${installed.join(", ")}`);
  }

  return (names.length ? names : installed).map((name) => {
    const lockItem = lock.items[name];
    if (!registry.has(name)) return { name, from: lockItem.version, files: [], newDependencies: [], newItems: [] };

    const item = registry.item(name);
    const upstream = new Map(item.files.map((f) => [f.path, f.content]));
    const paths = [...new Set([...Object.keys(lockItem.files), ...upstream.keys()])];
    const previousDeps = new Set(lockItem.dependencies ?? []);
    return {
      name,
      from: lockItem.version,
      to: item.version,
      files: paths.map((p) => planFile(project, config, lockItem, p, upstream.get(p), item.version)),
      newDependencies: item.dependencies.filter((d) => !previousDeps.has(d)),
      newItems: item.registryDependencies.filter((d) => !lock.items[d]),
    };
  });
}

// --- diff ----------------------------------------------------------------------

const describe: Record<FileStatus, string> = {
  unchanged: "unchanged",
  modified: "you changed it; upgrade keeps your version",
  update: "upstream changed it; upgrade will replace it",
  merge: "you and upstream changed it; upgrade will merge both",
  conflict: "you and upstream changed the same lines; upgrade will add conflict markers",
  new: "new in this version; upgrade will add it",
  removed: "no longer shipped; your copy stays",
  missing: "you deleted it; upgrade won't restore it",
  "no-base": "you changed it, but it was installed before merge bases existed; upgrade will write the new version next to it",
};

export function diff(ctx: Context, names: string[], opts: { patch?: boolean } = {}) {
  const project = new Project(ctx.cwd);
  const plans = planItems(ctx, names);
  const counts: Partial<Record<FileStatus, number>> = {};

  for (const item of plans) {
    if (!item.to) {
      ctx.out.warn(`${item.name} ${item.from}: no longer in the registry; your files are untouched`);
      continue;
    }
    const changed = item.files.filter((f) => f.status !== "unchanged");
    const version = item.from === item.to ? item.from : `${item.from} → ${item.to}`;
    ctx.out.info(`${item.name} ${version}${changed.length ? "" : "  (up to date)"}`);
    for (const f of changed) {
      counts[f.status] = (counts[f.status] ?? 0) + 1;
      ctx.out.info(`  ${f.status.padEnd(9)} ${project.rel(f.target)}  (${describe[f.status]})`);
      if (!opts.patch) continue;
      const rel = project.rel(f.target);
      if (f.local && f.base !== undefined && f.local.text !== f.base) {
        ctx.out.info(indent(createTwoFilesPatch(`${rel} (as shipped)`, `${rel} (yours)`, f.base, f.local.text, "", "", { context: 2 })));
      }
      if (f.upstream !== undefined && f.base !== undefined && f.upstream !== f.base) {
        ctx.out.info(indent(createTwoFilesPatch(`${rel} (as shipped)`, `${rel} (rdloom ${item.to})`, f.base, f.upstream, "", "", { context: 2 })));
      }
    }
    if (item.newItems.length) ctx.out.info(`  also adds: ${item.newItems.join(", ")}`);
    if (item.newDependencies.length) ctx.out.info(`  new dependencies: ${item.newDependencies.join(", ")}`);
  }

  const pending = (counts.update ?? 0) + (counts.merge ?? 0) + (counts.conflict ?? 0) + (counts.new ?? 0) + (counts["no-base"] ?? 0);
  ctx.out.info(
    pending
      ? `\n${pending} file(s) to upgrade${counts.conflict ? `, ${counts.conflict} with conflicts` : ""}. Run \`rdloom upgrade\`${opts.patch ? "" : ", or add --patch to see the changes"}.`
      : "\nEverything is up to date.",
  );
  return plans;
}

const indent = (s: string) => s.split("\n").map((l) => `    ${l}`).join("\n");

// --- upgrade -------------------------------------------------------------------

export interface UpgradeResult {
  conflicts: string[];
  changed: number;
}

export function upgrade(ctx: Context, names: string[], opts: { dryRun?: boolean; install?: boolean } = {}): UpgradeResult {
  const project = new Project(ctx.cwd);
  const plans = planItems(ctx, names);
  const lock = project.lock();
  const conflicts: string[] = [];
  const newDeps = new Set<string>();
  const newItems = new Set<string>();
  let changed = 0;
  const would = opts.dryRun ? "would " : "";

  for (const item of plans) {
    if (!item.to) {
      ctx.out.warn(`${item.name} ${item.from}: no longer in the registry; left as is`);
      continue;
    }
    const actions = item.files.filter((f) => f.status !== "unchanged" && f.status !== "modified");
    ctx.out.info(`${item.name} ${item.from} → ${item.to}${actions.length ? "" : "  (nothing to change)"}`);

    for (const f of item.files) {
      const rel = project.rel(f.target);
      const eol = f.local?.eol;
      switch (f.status) {
        case "update":
        case "new":
          ctx.out.info(`  ${would}${f.status === "new" ? "add    " : "update "} ${rel}`);
          if (!opts.dryRun) writeText(f.target, f.upstream!, eol);
          changed++;
          break;
        case "merge":
          ctx.out.info(`  ${would}merge   ${rel}  (kept your changes)`);
          if (!opts.dryRun) writeText(f.target, f.merged!, eol);
          changed++;
          break;
        case "conflict":
          ctx.out.warn(`  ${would}CONFLICT ${rel}  (resolve the <<<<<<< markers)`);
          if (!opts.dryRun) writeText(f.target, f.merged!, eol);
          conflicts.push(rel);
          changed++;
          break;
        case "no-base":
          ctx.out.warn(`  ${would}write   ${rel}.upstream  (merge it into ${rel} by hand)`);
          if (!opts.dryRun) writeText(`${f.target}.upstream`, f.upstream!, eol);
          changed++;
          break;
        case "removed":
          ctx.out.info(`  keep    ${rel}  (no longer shipped)`);
          break;
        case "missing":
          ctx.out.info(`  skip    ${rel}  (you deleted it)`);
          break;
        default: // unchanged, modified: nothing to write
      }
      // The new version becomes the merge base for the next upgrade.
      if (!opts.dryRun) {
        if (f.upstream !== undefined) writeText(project.base(f.path), f.upstream);
        else fs.rmSync(project.base(f.path), { force: true });
      }
    }

    if (!opts.dryRun) {
      const files = Object.fromEntries(item.files.filter((f) => f.upstream !== undefined).map((f) => [f.path, sha(f.upstream!)]));
      const registryItem = registryOf(ctx).item(item.name);
      lock.items[item.name] = { version: item.to, files, dependencies: registryItem.dependencies, ...sourceOf(ctx, item.name) };
    }
    item.newDependencies.forEach((d) => newDeps.add(d));
    item.newItems.forEach((d) => newItems.add(d));
  }

  if (opts.dryRun) {
    ctx.out.info(`\nDry run: nothing was written. ${changed} file(s) would change.`);
    return { conflicts, changed };
  }
  project.saveLock(lock);

  if (newItems.size) {
    ctx.out.info(`\nAdding new dependencies of upgraded components: ${[...newItems].join(", ")}`);
    add(ctx, [...newItems], { quiet: true, install: opts.install });
  }
  installDependencies(ctx, [...newDeps], opts.install);

  if (conflicts.length) {
    ctx.out.warn(`\n${conflicts.length} file(s) have conflicts. Fix the <<<<<<< / >>>>>>> sections, then commit.`);
  } else {
    ctx.out.info(changed ? `\nUpgraded. ${changed} file(s) changed; review and commit.` : "\nEverything was already up to date.");
  }
  return { conflicts, changed };
}
