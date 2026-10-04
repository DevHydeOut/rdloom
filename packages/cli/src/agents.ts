import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, type Config } from "./project.ts";

// `rdloom init` tells AI coding agents about rdloom: a marked block in
// AGENTS.md (read by Codex, Cursor, Copilot and others), a pointer to it from
// CLAUDE.md, and the MCP server in each client's project config. Re-running
// replaces only our block and our server entry.

const START = "<!-- rdloom:start -->";
const END = "<!-- rdloom:end -->";

export const MCP_SERVER = { command: "npx", args: ["-y", "@rdloom/mcp"] };

export function agentRules(config: Config): string {
  const dir = config.componentsDir.replace(/\\/g, "/");
  return `${START}
## UI components (rdloom)

This project uses rdloom components. Their source is in \`${dir}\`; it belongs to this project and may be edited.

- Before building UI, use an rdloom component if one fits: \`npx rdloom list --json\`. Add one with \`npx rdloom add <name> --json\`.
- Import from the local files, e.g. \`import { Button } from "./${dir}/button/button"\` (adjust the relative path).
- Check props with the rdloom MCP server (\`get_component\`, \`validate_props\`) instead of guessing. Props follow React Aria: \`isDisabled\`, \`onPress\`, \`isInvalid\`, not \`disabled\`, \`onClick\`.
- Every field needs a visible \`label\` (or an \`aria-label\` when there is no visible text).
- Style with the \`--rd-*\` design tokens; don't hard-code colours.
- To update components, run \`npx rdloom diff --json\`, then \`npx rdloom upgrade --json\`. Resolve any \`<<<<<<<\` conflict markers it leaves. Never re-add a component over edited files.
- Don't edit \`rdloom.lock.json\` or \`.rdloom/\` by hand; the CLI uses them to upgrade safely.
${END}`;
}

/** Puts our block in `text`: replaces an existing one, else appends. */
export function withBlock(text: string, block: string): string {
  const start = text.indexOf(START);
  const end = text.indexOf(END);
  if (start !== -1 && end > start) return text.slice(0, start) + block + text.slice(end + END.length);
  return text.trim() ? `${text.replace(/\s+$/, "")}\n\n${block}\n` : `${block}\n`;
}

function upsertText(file: string, update: (current: string) => string): boolean {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const eol = current.includes("\r\n") ? "\r\n" : "\n";
  const next = update(current.replace(/\r\n/g, "\n"));
  if (next === current.replace(/\r\n/g, "\n")) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, eol === "\n" ? next : next.replace(/\n/g, "\r\n"));
  return true;
}

function upsertServer(file: string, key: "mcpServers" | "servers", entry: object): boolean {
  let config: Record<string, Record<string, unknown>>;
  try {
    config = readJson(file) ?? {};
  } catch {
    return false; // not valid JSON (comments, a typo): leave the user's file alone
  }
  const servers = (config[key] ??= {});
  if (JSON.stringify(servers.rdloom) === JSON.stringify(entry)) return false;
  servers.rdloom = entry;
  writeJson(file, config);
  return true;
}

/** Writes the agent files; returns the ones created or changed, relative to cwd. */
export function writeAgentFiles(cwd: string, config: Config): string[] {
  const changed: string[] = [];
  const at = (rel: string) => path.join(cwd, rel);

  if (upsertText(at("AGENTS.md"), (t) => withBlock(t, agentRules(config)))) changed.push("AGENTS.md");
  // Claude Code reads CLAUDE.md; point it at AGENTS.md unless it already imports it.
  const claudeBlock = `${START}\n@AGENTS.md\n${END}`;
  if (upsertText(at("CLAUDE.md"), (t) => (/^@AGENTS\.md\s*$/m.test(t) && !t.includes(START) ? t : withBlock(t, claudeBlock)))) {
    changed.push("CLAUDE.md");
  }

  if (upsertServer(at(".mcp.json"), "mcpServers", MCP_SERVER)) changed.push(".mcp.json");
  // Only for editors the project already uses, so we don't add stray folders.
  if (fs.existsSync(at(".cursor")) && upsertServer(at(".cursor/mcp.json"), "mcpServers", MCP_SERVER)) changed.push(".cursor/mcp.json");
  if (fs.existsSync(at(".vscode")) && upsertServer(at(".vscode/mcp.json"), "servers", { type: "stdio", ...MCP_SERVER })) {
    changed.push(".vscode/mcp.json");
  }
  return changed;
}
