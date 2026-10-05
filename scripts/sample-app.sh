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
# Whatever versions npm pack just wrote. [0-9] keeps rdloom-* off the mcp tarball.
cli_pack=(./.packs/rdloom-[0-9]*.tgz)
mcp_pack=(./.packs/rdloom-mcp-[0-9]*.tgz)
test -e "${cli_pack[0]}" && test -e "${mcp_pack[0]}" || { echo "✗ no tarballs in .packs"; exit 1; }
npm install -D --silent --no-audit --no-fund "${cli_pack[0]}" "${mcp_pack[0]}"
test ! -e node_modules/rdloom/src || { echo "✗ the package shipped TypeScript source"; exit 1; }

step "rdloom init + add"
npx rdloom init
npx rdloom add "${components[@]}" --install
npx rdloom list | head -3

step "Motion components: one stylesheet, installed and imported for you"
test ! -e src/styles/rdloom-motion.css || { echo "✗ motion CSS exists before any motion component was added"; exit 1; }
npx rdloom add shimmer-button text-shimmer blur-fade --install
test -e src/styles/rdloom-motion.css || { echo "✗ rdloom add did not write the motion CSS"; exit 1; }
grep -q 'rdloom-motion.css' src/styles/rdloom-tokens.css || { echo "✗ the tokens file does not import the motion CSS"; exit 1; }

step "AI components: the chat and every part it is made of"
npx rdloom add chat generated-chart --install
for part in message response tool-call approval-box agent-activity citation sources prompt-input generated-table generated-chart chat button table; do
  test -e "src/components/rdloom/$part/$part.tsx" || { echo "✗ rdloom add chat did not bring $part"; exit 1; }
done
test -e src/components/rdloom/utils/ai.ts || { echo "✗ the message types (utils/ai.ts) were not installed"; exit 1; }
echo "✓ chat and its parts installed"

step "Typecheck and production build"
npm run build --silent
# The keyframes must be in the CSS the browser actually loads, with no <style> tag in the markup.
grep -rq '@keyframes rdm-shimmer' dist/assets/*.css || { echo "✗ the motion keyframes are not in the built CSS"; exit 1; }
! grep -rl '<style' src/components/rdloom/shimmer-button src/components/rdloom/text-shimmer >/dev/null 2>&1 || { echo "✗ a motion component still renders a <style> tag"; exit 1; }
echo "✓ motion keyframes ship in the built CSS"

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
