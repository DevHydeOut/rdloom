import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { writeAgentFiles, withBlock } from "../src/agents.ts";
import { add, init, type Context } from "../src/commands.ts";
import { closest, DEFAULT_CONFIG, normalizeName } from "../src/project.ts";

// What makes the CLI easy for AI agents: rules files from init, names written
// as in code, errors that name the fix, and --json output.

const CLI = fileURLToPath(new URL("../src/index.ts", import.meta.url));
const REGISTRY = fileURLToPath(new URL("../registry", import.meta.url));

let cwd: string;
let ctx: Context;
const read = (rel: string) => fs.readFileSync(path.join(cwd, rel), "utf8");
const write = (rel: string, text: string) => {
  fs.mkdirSync(path.dirname(path.join(cwd, rel)), { recursive: true });
  fs.writeFileSync(path.join(cwd, rel), text);
};

beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), "rdloom-agents-"));
  write("package.json", "{}");
  ctx = { cwd, registryDir: REGISTRY, out: { info: () => {}, warn: () => {} } };
});
afterEach(() => fs.rmSync(cwd, { recursive: true, force: true }));

function cli(...args: string[]) {
  // The source uses parameter properties, which Node's plain type stripping rejects.
  const node = ["--experimental-transform-types", "--no-warnings", CLI];
  const r = spawnSync(process.execPath, [...node, ...args, "--cwd", cwd], { encoding: "utf8", env: { ...process.env, RDLOOM_REGISTRY: REGISTRY } });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe("agent files", () => {
  it("init writes AGENTS.md, CLAUDE.md and the MCP server", () => {
    init(ctx);
    expect(read("AGENTS.md")).toContain("npx rdloom add <name> --json");
    expect(read("AGENTS.md")).toContain(DEFAULT_CONFIG.componentsDir);
    expect(read("CLAUDE.md")).toContain("@AGENTS.md");
    expect(JSON.parse(read(".mcp.json")).mcpServers.rdloom).toEqual({ command: "npx", args: ["-y", "@rdloom/mcp"] });
    expect(fs.existsSync(path.join(cwd, ".cursor"))).toBe(false);
  });

  it("keeps the user's content and other servers, and is stable on re-run", () => {
    write("AGENTS.md", "# Our rules\n\nUse tabs.\n");
    write(".mcp.json", JSON.stringify({ mcpServers: { other: { command: "x" } } }));
    write(".cursor/rules.md", "");
    write(".vscode/settings.json", "{}");

    expect(writeAgentFiles(cwd, DEFAULT_CONFIG)).toEqual(["AGENTS.md", "CLAUDE.md", ".mcp.json", ".cursor/mcp.json", ".vscode/mcp.json"]);
    expect(read("AGENTS.md")).toMatch(/^# Our rules\n\nUse tabs\.\n\n<!-- rdloom:start -->/);
    expect(Object.keys(JSON.parse(read(".mcp.json")).mcpServers)).toEqual(["other", "rdloom"]);
    expect(JSON.parse(read(".vscode/mcp.json")).servers.rdloom.type).toBe("stdio");

    expect(writeAgentFiles(cwd, DEFAULT_CONFIG)).toEqual([]);
    expect(read("AGENTS.md").match(/rdloom:start/g)).toHaveLength(1);
  });

  it("replaces only its own block when the config changes", () => {
    const text = withBlock("before\n", "<!-- rdloom:start -->old<!-- rdloom:end -->");
    expect(withBlock(text + "after\n", "<!-- rdloom:start -->new<!-- rdloom:end -->")).toBe(
      "before\n\n<!-- rdloom:start -->new<!-- rdloom:end -->\nafter\n",
    );
  });

  it("leaves a CLAUDE.md that already imports AGENTS.md, and invalid JSON, alone", () => {
    write("CLAUDE.md", "@AGENTS.md\n");
    write(".mcp.json", "{ // comment\n}");
    expect(writeAgentFiles(cwd, DEFAULT_CONFIG)).toEqual(["AGENTS.md"]);
  });

  it("can be skipped", () => {
    init(ctx, { agents: false });
    expect(fs.existsSync(path.join(cwd, "AGENTS.md"))).toBe(false);
  });
});

describe("names and suggestions", () => {
  it("accepts names written as in code", () => {
    expect(normalizeName("DataGrid")).toBe("data-grid");
    expect(normalizeName("date_range_picker")).toBe("date-range-picker");
    expect(normalizeName("Text Field")).toBe("text-field");
    init(ctx);
    expect(add(ctx, ["DataGrid"]).added).toContain("data-grid");
  });

  it("suggests the likely name", () => {
    expect(closest("datagrid", ["button", "data-grid"])).toBe("data-grid");
    expect(closest("buton", ["button", "dialog"])).toBe("button");
    expect(closest("carousel", ["button", "dialog"])).toBeUndefined();
    init(ctx);
    expect(() => add(ctx, ["comboboxx"])).toThrow(/Did you mean "combobox"\?/);
  });
});

describe("command line", () => {
  it("prints one JSON object with --json", () => {
    expect(cli("init", "--json", "-y").status).toBe(0);
    const out = cli("add", "Button", "--json");
    expect(out.status).toBe(0);
    const parsed = JSON.parse(out.stdout);
    expect(parsed).toMatchObject({ ok: true, command: "add", result: { added: expect.arrayContaining(["button"]) } });

    const listed = JSON.parse(cli("list", "--json").stdout);
    expect(listed.result.find((i: { name: string }) => i.name === "button").installed).toBeTruthy();
  });

  it("reports errors as JSON too", () => {
    cli("init", "--json");
    const out = cli("add", "buton", "--json");
    expect(out.status).toBe(1);
    expect(JSON.parse(out.stdout)).toMatchObject({ ok: false, error: expect.stringContaining('Did you mean "button"') });
  });

  it("names the fix for unknown commands and options", () => {
    expect(cli("install", "button").stderr).toContain("Did you mean `rdloom add`?");
    expect(cli("upgrad").stderr).toContain("Did you mean `rdloom upgrade`?");
    expect(cli("add", "button", "--force").stderr).toContain("Did you mean --overwrite?");
    expect(cli("upgrade", "--dryrun").stderr).toContain("Did you mean --dry-run?");
  });
});
