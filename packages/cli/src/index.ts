#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { add, diff, init, list, runCommand, upgrade, type Context, type ItemPlan } from "./commands.ts";
import { CliError, closest, Project, readJson, type Config } from "./project.ts";
import { buildRegistry, validateRegistry } from "./registry-build.ts";
import { loadRemote, parseSourceId, parseSpec, type RemoteSpec } from "./remote.ts";

type Flags = Record<string, string | undefined>;

const VALUE_FLAGS = ["cwd", "components-dir", "tokens-css"];

const SHORT: Record<string, string> = { y: "yes", h: "help" };

function parse(argv: string[]) {
  const positional: string[] = [];
  const flags: Flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (/^-[a-z]$/i.test(arg)) {
      flags[SHORT[arg[1]] ?? arg.slice(1)] = "true";
      continue;
    }
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const [key, inline] = arg.slice(2).split("=", 2);
    if (inline !== undefined) flags[key] = inline;
    else if (VALUE_FLAGS.includes(key)) flags[key] = argv[++i];
    else flags[key] = "true";
  }
  return { command: positional[0], args: positional.slice(1), flags };
}

const HELP = `rdloom: own your components, keep them upgradable

Usage:
  rdloom init [--components-dir <dir>] [--tokens-css <file>] [--no-agents]
  rdloom add <component...> [--overwrite] [--install]
  rdloom list
  rdloom diff [component...] [--patch]
  rdloom upgrade [component...] [--dry-run] [--install]
  rdloom registry build [manifest]      (default: rdloom-registry.json)
  rdloom registry validate [manifest]

Components can come from GitHub repositories that publish an rdloom registry:
  rdloom add owner/repo/item            (default branch)
  rdloom add owner/repo/item#v2         (a branch, tag or commit)
  rdloom add @acme/item                 (with "registries": { "@acme": "owner/repo" }
                                         in rdloom.json)
Private repositories work when GH_TOKEN or GITHUB_TOKEN is set, or you're
logged in to the GitHub CLI (gh auth login).

diff shows, per file, whether you changed it, upstream changed it, or both.
upgrade applies upstream changes: untouched files are replaced, your edits
are merged in, and overlapping edits get git-style conflict markers.

init also writes AI agent rules (AGENTS.md, CLAUDE.md) and adds the rdloom
MCP server to .mcp.json (and .cursor/ or .vscode/ when those exist).

Component names can be written as in code: \`rdloom add DataGrid\` works.

Options:
  --cwd <dir>   Project directory (default: current directory)
  --json        Print one JSON object on stdout: { ok, command, result, messages, warnings }
  -y, --yes     Accepted for scripts and agents; rdloom never asks questions`;

const { command, args, flags } = parse(process.argv.slice(2));
const json = flags.json === "true";
const messages: string[] = [];
const warnings: string[] = [];
const ctx: Context = {
  cwd: path.resolve(flags.cwd ?? process.cwd()),
  registryDir: process.env.RDLOOM_REGISTRY ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../registry"),
  out: json
    ? { info: (m) => messages.push(m.trim()), warn: (m) => warnings.push(m.trim()) }
    : { info: (m) => console.log(m), warn: (m) => console.warn(m) },
  run: json ? (cmd, cwd) => runCommand(cmd, cwd, true) : undefined,
};
const on = (name: string) => flags[name] === "true";

const COMMON = ["cwd", "json", "yes", "help"];
const COMMAND_FLAGS: Record<string, string[]> = {
  init: ["components-dir", "tokens-css", "no-agents"],
  add: ["overwrite", "install"],
  list: [],
  diff: ["patch"],
  upgrade: ["dry-run", "install"],
  registry: [],
  help: [],
};
/** Flags agents often reach for, mapped to ours. */
const ALIASES: Record<string, string> = { force: "overwrite", dry: "dry-run", dryrun: "dry-run", "no-ai": "no-agents" };

/** Commands borrowed from other tools, mapped to ours. */
const COMMAND_ALIASES: Record<string, string> = { install: "add", i: "add", update: "upgrade", ls: "list", status: "diff", setup: "init" };

/** Unknown commands and flags fail with the likely fix, instead of being ignored. */
function checkUsage() {
  if (command === undefined) return;
  const commands = Object.keys(COMMAND_FLAGS);
  if (!commands.includes(command)) {
    const guess = COMMAND_ALIASES[command] ?? closest(command, commands);
    throw new CliError(`unknown command "${command}".${guess ? ` Did you mean \`rdloom ${guess}\`?` : ""} Run \`rdloom help\` for usage.`);
  }
  const allowed = [...COMMON, ...COMMAND_FLAGS[command]];
  for (const flag of Object.keys(flags)) {
    if (allowed.includes(flag)) continue;
    const guess = ALIASES[flag] && allowed.includes(ALIASES[flag]) ? ALIASES[flag] : closest(flag, allowed);
    throw new CliError(
      `unknown option --${flag} for \`rdloom ${command}\`.${guess ? ` Did you mean --${guess}?` : ""} Options: ${COMMAND_FLAGS[command].map((f) => `--${f}`).join(", ") || "none"}`,
    );
  }
}

/** diff's plans, without file contents. */
const summarize = (plans: ItemPlan[], project: Project) =>
  plans.map((p) => ({
    name: p.name,
    from: p.from,
    to: p.to ?? null,
    files: p.files.map((f) => ({ path: project.rel(f.target), status: f.status })),
    newDependencies: p.newDependencies,
    newItems: p.newItems,
  }));

/**
 * The GitHub registry items a command needs, fetched before it runs so the
 * commands themselves stay synchronous: names given to `add`, and installed
 * GitHub items for `diff` and `upgrade` (re-fetched at their branch or tag).
 */
async function remoteSpecs(): Promise<RemoteSpec[]> {
  const config = readJson<Config>(new Project(ctx.cwd).configFile);
  const registries = config?.registries ?? {};
  if (command === "add") return args.map((a) => parseSpec(a, registries)).filter((s): s is RemoteSpec => s !== null);
  if (command !== "diff" && command !== "upgrade") return [];
  const lock = new Project(ctx.cwd).lock();
  return Object.entries(lock.items)
    .filter(([name, item]) => item.source && (args.length === 0 || args.includes(name)))
    .map(([name, item]) => ({
      key: name,
      prefix: name.slice(0, name.lastIndexOf("/") + 1),
      item: name.slice(name.lastIndexOf("/") + 1),
      source: parseSourceId(item.source!),
    }));
}

let result: unknown = null;
try {
  checkUsage();
  const specs = await remoteSpecs();
  if (specs.length) {
    ctx.out.info(`Fetching from GitHub: ${[...new Set(specs.map((s) => `${s.source.owner}/${s.source.repo}`))].join(", ")}`);
    const config = readJson<Config>(new Project(ctx.cwd).configFile);
    ctx.remote = await loadRemote(specs, config?.registries);
  }
  switch (on("help") ? "help" : command) {
    case "init":
      result = init(ctx, { componentsDir: flags["components-dir"], tokensCss: flags["tokens-css"], agents: !on("no-agents") });
      break;
    case "add":
      result = add(ctx, args, { overwrite: on("overwrite"), install: on("install") });
      break;
    case "list":
      result = list(ctx);
      break;
    case "diff":
      result = summarize(diff(ctx, args, { patch: on("patch") }), new Project(ctx.cwd));
      break;
    case "registry": {
      const [sub, manifest] = args;
      if (sub === "build") buildRegistry(ctx.cwd, manifest, ctx.out, ctx.registryDir);
      else if (sub === "validate") {
        const valid = validateRegistry(ctx.cwd, manifest, ctx.out, ctx.registryDir);
        result = { valid };
        if (!valid) process.exitCode = 1;
      } else throw new CliError("use `rdloom registry build` or `rdloom registry validate`");
      break;
    }
    case "upgrade": {
      const upgraded = upgrade(ctx, args, { dryRun: on("dry-run"), install: on("install") });
      result = upgraded;
      if (upgraded.conflicts.length) process.exitCode = 1; // so scripts and CI notice
      break;
    }
    default: // undefined or "help"; checkUsage() rejected anything else
      if (json) result = { usage: HELP };
      else console.log(HELP);
  }
  if (json) console.log(JSON.stringify({ ok: !process.exitCode, command: command ?? "help", result, messages, warnings }, null, 2));
} catch (error) {
  if (!(error instanceof CliError)) throw error;
  if (json) console.log(JSON.stringify({ ok: false, command: command ?? "help", error: error.message, messages, warnings }, null, 2));
  else console.error(`error: ${error.message}`);
  process.exit(1);
}
