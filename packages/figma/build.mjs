// Bundles src/code.ts (and the generated spec data) into dist/code.js for Figma.
import { build } from "esbuild";

await build({
  entryPoints: [new URL("./src/code.ts", import.meta.url).pathname.replace(/^\/(\w:)/, "$1")],
  outfile: new URL("./dist/code.js", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"),
  bundle: true,
  target: "es2017",
  format: "iife",
  logLevel: "info",
});
