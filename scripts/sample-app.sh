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

step "Blocks: the customer table and every part it is made of"
npx rdloom add customer-table --install
for part in customer-table chart stat sparkline table pagination select badge avatar alert empty-state skeleton button; do
  test -e "src/components/rdloom/$part/$part.tsx" || { echo "✗ rdloom add customer-table did not bring $part"; exit 1; }
done
test -e src/components/rdloom/customer-table/query.ts || { echo "✗ the customer table logic (query.ts) was not installed"; exit 1; }
echo "✓ customer table and its parts installed"
npx rdloom add dashboard-shell dashboard-page --install
for part in dashboard-shell dashboard-page sidebar sheet tooltip menu avatar; do
  test -e "src/components/rdloom/$part/$part.tsx" || { echo "✗ rdloom add dashboard-shell did not bring $part"; exit 1; }
done
test -e src/components/rdloom/sidebar/nav.ts || { echo "✗ the navigation helpers (sidebar/nav.ts) were not installed"; exit 1; }
echo "✓ dashboard shell and its parts installed"
npx rdloom add sidebar --install
echo "✓ sidebar installed on its own"

step "Forms: the form, its fields, the error summary and repeating rows"
npx rdloom add form field-array error-summary --install
for part in form field-array error-summary text-field number-field select checkbox switch button; do
  test -e "src/components/rdloom/$part/$part.tsx" || { echo "✗ rdloom add form did not bring $part"; exit 1; }
done
test -e src/components/rdloom/form/form-engine.ts || { echo "✗ the form engine adapter (form-engine.ts) was not installed"; exit 1; }
grep -q '@tanstack/react-form' package.json || { echo "✗ the form engine dependency was not added to package.json"; exit 1; }
echo "✓ forms and their parts installed"

step "Small components: confirm dialog, one-time code, collapsible, separator, toggle button, avatar group"
npx rdloom add alert-dialog input-otp collapsible separator toggle-button avatar-group --install
for part in alert-dialog input-otp collapsible separator toggle-button avatar-group text-field; do
  test -e "src/components/rdloom/$part/$part.tsx" || { echo "✗ rdloom add did not bring $part"; exit 1; }
done
echo "✓ small components installed"

step "Page structure and actions: page header, section header, footer, error state, auth card, action button"
npx rdloom add page-header section-header app-footer error-state auth-card action-button --install
for part in page-header section-header app-footer error-state auth-card action-button alert-dialog separator tooltip; do
  test -e "src/components/rdloom/$part/$part.tsx" || { echo "✗ rdloom add did not bring $part"; exit 1; }
done
test -e src/components/rdloom/utils/url-state.ts || { echo "✗ the address-state helpers (utils/url-state.ts) were not installed"; exit 1; }
test -e src/components/rdloom/utils/permissions.ts || { echo "✗ the permission helpers (utils/permissions.ts) were not installed"; exit 1; }
echo "✓ page structure and actions installed"

step "The users workflow: data table, invite dialog, user form"
npx rdloom add data-table invite-dialog user-form --install
for part in data-table invite-dialog user-form action-button alert-dialog field-array error-summary menu sheet pagination empty-state error-state; do
  test -e "src/components/rdloom/$part/$part.tsx" || { echo "✗ rdloom add data-table did not bring $part"; exit 1; }
done
test -e src/components/rdloom/data-table/query.ts || { echo "✗ the table logic (data-table/query.ts) was not installed"; exit 1; }
echo "✓ users workflow installed"

step "Navigation, settings and billing blocks, and the last core components"
npx rdloom add user-menu app-header top-nav settings-section plan-card usage-meter payment-method-card api-key-list carousel resizable-panels hover-card context-menu color-picker rating --install
for part in user-menu app-header top-nav settings-section plan-card usage-meter payment-method-card api-key-list carousel resizable-panels hover-card context-menu color-picker rating sidebar sheet alert-dialog; do
  test -e "src/components/rdloom/$part/$part.tsx" || { echo "✗ rdloom add did not bring $part"; exit 1; }
done
echo "✓ navigation, settings, billing and the last core components installed"

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
