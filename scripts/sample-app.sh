#!/usr/bin/env bash
# Sets up examples/admin-demo the way a user would: outside this repo (so
# nothing resolves from our node_modules), with the CLI and MCP server
# installed from the tarballs `npm publish` would upload.
#
#   bash scripts/sample-app.sh [target-dir]    default: $TMPDIR/rdloom-admin-demo
#   then: cd <target-dir> && npm run dev
set -euo pipefail

repo="$(cd "$(dirname "$0")/.." && pwd)"
target="${1:-${TMPDIR:-/tmp}/rdloom-admin-demo}"
components=(button text-field select combobox date-picker date-range-picker dialog toast data-grid)

step() { printf '\n\033[1m== %s\033[0m\n' "$*"; }

step "Build and pack rdloom + @rdloom/mcp"
(cd "$repo" && npm run gen --silent >/dev/null)
rm -rf "$target"
mkdir -p "$target/.packs"
(cd "$repo" && npm pack -w rdloom -w @rdloom/mcp --pack-destination "$target/.packs" --silent)
cp -R "$repo/examples/admin-demo/." "$target/"
rm -rf "$target/node_modules" "$target/dist"
cd "$target"

step "Install the app and the packed tools"
npm install --silent --no-audit --no-fund
npm install -D --silent --no-audit --no-fund ./.packs/rdloom-0.0.0.tgz ./.packs/rdloom-mcp-0.0.0.tgz
test ! -e node_modules/rdloom/src || { echo "✗ the package shipped TypeScript source"; exit 1; }

step "rdloom init + add"
npx rdloom init
npx rdloom add "${components[@]}" --install
npx rdloom list | head -3

step "Typecheck and production build"
npm run build --silent

step "MCP server, started from the installed package"
node --input-type=module -e '
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const client = new Client({ name: "sample-app", version: "0" });
await client.connect(new StdioClientTransport({ command: "node", args: ["node_modules/@rdloom/mcp/dist/index.js"], stderr: "ignore" }));
const res = await client.callTool({ name: "validate_props", arguments: { name: "Button", props: { variant: "primary", children: "Save" } } });
await client.close();
if (!res.content[0].text.startsWith("✓")) { console.error(res); process.exit(1); }
console.log("✓ MCP server answers from node_modules");
'

step "Done"
echo "App ready in $target"
echo "  cd \"$target\" && npm run dev"
