// Starts the MCP server the way an agent does (a child process on stdio) and
// calls one tool. Run: node scripts/build-bins.mjs && node scripts/smoke-mcp.mjs
import { existsSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// The built file runs on any Node version; the TypeScript source only runs on the newest ones.
const entry = "packages/mcp/dist/index.js";
if (!existsSync(entry)) {
  console.error(`✗ ${entry} is missing. Build it first: node scripts/build-bins.mjs`);
  process.exit(1);
}

const client = new Client({ name: "smoke", version: "0" });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [entry] }));
const { tools } = await client.listTools();
const res = await client.callTool({ name: "get_component", arguments: { name: "button" } });
await client.close();

if (tools.length !== 7 || !res.content[0].text.startsWith("# Button")) {
  console.error("✗ unexpected MCP response", tools.map((t) => t.name), res);
  process.exit(1);
}
console.log(`✓ MCP server on stdio: ${tools.length} tools, get_component works`);
