// Fails if `npm run gen` changed or created committed files, i.e. someone
// edited a spec or component without regenerating. Run after `npm run gen`.
import { execFileSync } from "node:child_process";

const paths = ["packages/react/src/generated", "packages/cli/registry", "docs/accessibility-audit.md", "packages/mcp/context.json", "packages/figma/src/generated"];
const status = execFileSync("git", ["status", "--porcelain", "--", ...paths], { encoding: "utf8" }).trimEnd();

if (status) {
  console.error("Generated files are out of date. Run `npm run gen` and commit the result:\n");
  console.error(status);
  console.error("\n" + execFileSync("git", ["diff", "--stat", "--", ...paths], { encoding: "utf8" }));
  if (process.env.GITHUB_ACTIONS) console.log("::error::Generated files are out of date. Run npm run gen and commit.");
  process.exit(1);
}
console.log("✓ generated files match the specs");
