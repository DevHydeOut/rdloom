#!/usr/bin/env bash
# Builds a Next.js App Router app against the packed CLI, the way a user would.
#
# Server Components are the strictest consumer we have: anything that reaches
# react-aria-components or a hook without "use client" fails the build with
# "'client-only' cannot be imported from a Server Component module". A unit
# test asserts the directive, but only a real build proves the whole chain.
#
#   bash scripts/next-app.sh [target-dir]    default: $TMPDIR/rdloom-next-app
set -euo pipefail

repo="$(cd "$(dirname "$0")/.." && pwd)"
target="${1:-${TMPDIR:-/tmp}/rdloom-next-app}"
components=(button text-field select combobox date-range-picker dialog data-grid)

step() { printf '\n\033[1m== %s\033[0m\n' "$*"; }

step "Pack rdloom"
(cd "$repo" && npm run gen --silent >/dev/null)
rm -rf "$target"
mkdir -p "$target/app" "$target/.packs"
(cd "$repo" && npm pack -w rdloom --pack-destination "$target/.packs" --silent >/dev/null)
cd "$target"

step "A plain Next.js App Router app"
cat > package.json <<'EOF'
{
  "name": "rdloom-next-app",
  "private": true,
  "scripts": { "build": "next build" },
  "dependencies": { "next": "^15.0.0", "react": "^19.0.0", "react-dom": "^19.0.0" },
  "devDependencies": {
    "typescript": "^5.6.0", "@types/react": "^19.0.0", "@types/node": "^22.0.0",
    "tailwindcss": "^4.1.0", "@tailwindcss/postcss": "^4.1.0"
  }
}
EOF
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022", "lib": ["dom", "es2022"], "jsx": "preserve", "module": "esnext",
    "moduleResolution": "bundler", "strict": true, "skipLibCheck": true, "noEmit": true,
    "allowJs": true, "incremental": true, "plugins": [{ "name": "next" }]
  },
  "include": ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
echo "const config = { plugins: { '@tailwindcss/postcss': {} } }; export default config;" > postcss.config.mjs
cat > app/layout.tsx <<'EOF'
import "./globals.css";
export const metadata = { title: "rdloom in Next.js" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
EOF
npm install --silent --no-audit --no-fund

step "Install the packed CLI, then init and add"
cli_pack=(./.packs/rdloom-[0-9]*.tgz)
test -e "${cli_pack[0]}" || { echo "✗ no tarball in .packs"; exit 1; }
npm install -D --silent --no-audit --no-fund "${cli_pack[0]}"
npx rdloom init
npx rdloom add "${components[@]}" --install

step "Import the components from a Server Component"
# No "use client" here on purpose: this page is a Server Component, so the
# build only passes if every component brought its own directive. Props stay
# serialisable, because React cannot send a function across that boundary.
cat > app/page.tsx <<'EOF'
import { Button } from "../src/components/rdloom/button/button";
import { TextField } from "../src/components/rdloom/text-field/text-field";
import { DateRangePicker } from "../src/components/rdloom/date-range-picker/date-range-picker";
import { People } from "./people";

export default function Page() {
  return (
    <main>
      <Button variant="primary">Save</Button>
      <TextField label="Name" />
      <DateRangePicker label="Report period" />
      <People />
    </main>
  );
}
EOF
# Callbacks (getRowId, onCellEdit, onPress...) are functions, so anything using
# them lives in the client component itself, as a user's own code would.
cat > app/people.tsx <<'EOF'
"use client";

import { DataGrid } from "../src/components/rdloom/data-grid/data-grid";

interface Person { id: string; name: string; team: string }
const rows: Person[] = [
  { id: "1", name: "Ada", team: "Platform" },
  { id: "2", name: "Grace", team: "Design" },
];
const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "team", header: "Team" },
];

export function People() {
  return (
    <DataGrid
      label="People"
      data={rows}
      columns={columns}
      getRowId={(p: Person) => p.id}
      selectionMode="multiple"
      onSelectionChange={(ids) => console.log(ids)}
      height={200}
    />
  );
}
EOF
printf '@import "tailwindcss";\n@import "../src/styles/rdloom-tokens.css";\n@source "../src/components/rdloom";\n' > app/globals.css

step "Build"
npm run build

step "Done"
echo "✓ Next.js App Router builds with rdloom components in a Server Component"
