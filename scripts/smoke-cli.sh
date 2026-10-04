#!/usr/bin/env bash
# End-to-end check of the CLI, the way a user would use it: a fresh app runs
# `init`, `add`s every component, installs what the CLI asks for, and
# typechecks the copied code. Also checks that `add` never overwrites edits.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$(mktemp -d)"
# KEEP_APP=1 leaves the test app on disk for debugging.
if [ -z "${KEEP_APP:-}" ]; then trap 'rm -rf "$APP"' EXIT; else echo "keeping test app at $APP"; fi
cli() { "$ROOT/node_modules/.bin/tsx" "$ROOT/packages/cli/src/index.ts" "$@" --cwd "$APP"; }

cd "$APP"
cat > package.json <<'JSON'
{ "name": "smoke-app", "private": true, "type": "module" }
JSON
cat > tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler", "jsx": "react-jsx",
    "strict": true, "skipLibCheck": true, "noEmit": true
  },
  "include": ["src"]
}
JSON
mkdir -p src

echo "--- install app dependencies"
npm install --no-audit --no-fund --loglevel=error react@19 react-dom@19 @types/react@19 @types/react-dom@19 typescript@5

echo "--- rdloom init"
cli init

components=$(node -e '
  const index = require(process.argv[1]);
  console.log(index.items.filter((i) => i.type === "registry:ui").map((i) => i.name).join(" "));
' "$ROOT/packages/cli/registry/index.json")
echo "--- rdloom add $components"
cli add $components --install

echo "--- typecheck every copied component"
npx tsc -p .

echo "--- add must not overwrite a file the user edited"
edited="src/components/rdloom/button/button.tsx"
echo "// my local change" >> "$edited"
cli add button
if ! tail -n 1 "$edited" | grep -q "my local change"; then
  echo "FAIL: rdloom add overwrote a user-edited file" >&2
  exit 1
fi

echo "--- lock file records every added item"
node -e '
  const lock = require(process.argv[1]);
  const missing = process.argv.slice(2).filter((n) => !lock.items[n]);
  if (missing.length) { console.error("FAIL: missing from lock:", missing.join(", ")); process.exit(1); }
' "$APP/rdloom.lock.json" $components

echo "--- upgrade: merge a local edit with a new upstream version"
# Undo the edit above, then make a real local change near the top of Button.
cp "$APP/.rdloom/base/button/button.tsx" "$edited"
node -e '
  const fs = require("fs"); const f = process.argv[1];
  fs.writeFileSync(f, fs.readFileSync(f, "utf8").replace("sm: \"h-8 px-3 text-sm\"", "sm: \"h-7 px-2 text-xs\" /* ours */"));
' "$edited"
# Publish a "next version" of the registry where Button changed elsewhere.
NEXT="$APP/next-registry"
cp -r "$ROOT/packages/cli/registry" "$NEXT"
node -e '
  const fs = require("fs"); const f = process.argv[1]; const item = JSON.parse(fs.readFileSync(f, "utf8"));
  item.version = "9.9.9";
  const file = item.files.find((x) => x.path === "button/button.tsx");
  file.content = file.content.replace("lg: \"h-12 px-5 text-base\"", "lg: \"h-12 px-6 text-base\" /* upstream */");
  fs.writeFileSync(f, JSON.stringify(item));
' "$NEXT/button.json"

RDLOOM_REGISTRY="$NEXT" cli diff button
RDLOOM_REGISTRY="$NEXT" cli upgrade button
grep -q "/\* ours \*/" "$edited" || { echo "FAIL: upgrade lost the local edit" >&2; exit 1; }
grep -q "/\* upstream \*/" "$edited" || { echo "FAIL: upgrade didn't apply the upstream change" >&2; exit 1; }
if grep -q "<<<<<<<" "$edited"; then echo "FAIL: unexpected conflict markers" >&2; exit 1; fi
node -e 'const l = require(process.argv[1]); if (l.items.button.version !== "9.9.9") { console.error("FAIL: lock not bumped"); process.exit(1); }' "$APP/rdloom.lock.json"
npx tsc -p .

echo "✓ CLI smoke test passed ($(echo $components | wc -w) components, add + upgrade)"
