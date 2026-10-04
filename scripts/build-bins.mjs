// Compiles the CLI and MCP server to plain JavaScript in each package's dist/.
// Node won't strip TypeScript types from files inside node_modules, so the
// published bins must be .js. Dependencies stay external (npm installs them).
import { build } from "esbuild";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// Absolute paths, so it works from the repo root or from a package's prepack.
const root = fileURLToPath(new URL("..", import.meta.url));

const targets = [
  { pkg: "packages/cli", entry: "src/index.ts" },
  { pkg: "packages/mcp", entry: "src/index.ts" },
];

for (const t of targets) {
  await build({
    absWorkingDir: root,
    entryPoints: [`./${t.pkg}/${t.entry}`],
    outfile: `${t.pkg}/dist/index.js`,
    bundle: true,
    packages: "external",
    platform: "node",
    format: "esm",
    target: "node22",
    logLevel: "warning",
  });
  // esbuild keeps the source's `#!/usr/bin/env node` line.
  const out = fs.readFileSync(`${root}/${t.pkg}/dist/index.js`, "utf8");
  if (!out.startsWith("#!")) throw new Error(`${t.pkg}: missing shebang`);
  console.log(`built ${t.pkg}/dist/index.js (${(out.length / 1024).toFixed(1)} kB)`);

  // npm only ships a LICENSE that sits in the package itself, and ours is at
  // the repo root. Copy it in so every published tarball carries the terms.
  fs.copyFileSync(`${root}/LICENSE`, `${root}/${t.pkg}/LICENSE`);
}
