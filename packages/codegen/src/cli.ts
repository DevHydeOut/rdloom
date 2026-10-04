import path from "node:path";
import { root } from "./paths.ts";
import { buildAudit } from "./audit.ts";
import { buildFigmaData } from "./figma.ts";
import { buildMcpContext } from "./mcp.ts";
import { buildRegistry } from "./registry.ts";
import { buildTokens } from "./tokens.ts";
import { buildTypes } from "./types.ts";
import { validateSpecs } from "./validate.ts";

const rel = (file: string) => path.relative(root, file).replace(/\\/g, "/");

function validate(): boolean {
  const results = validateSpecs();
  let ok = true;
  for (const r of results) {
    if (r.errors.length === 0) {
      console.log(`✓ ${rel(r.file)}`);
    } else {
      ok = false;
      console.error(`✗ ${rel(r.file)}`);
      for (const e of r.errors) console.error(`    ${e}`);
    }
  }
  return ok;
}

function report(label: string, files: string[]) {
  for (const f of files) console.log(`${label} ${rel(f)}`);
}

const command = process.argv[2] ?? "all";

// Generators throw readable errors (bad token reference, loose dependency
// range...). Print the message, not a stack trace.
process.on("uncaughtException", (error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});

switch (command) {
  case "validate":
    if (!validate()) process.exit(1);
    break;
  case "tokens":
    report("wrote", buildTokens());
    break;
  case "types":
    report("wrote", buildTypes());
    break;
  case "registry":
    report("wrote", buildRegistry());
    break;
  case "all":
    if (!validate()) process.exit(1);
    report("wrote", buildTokens());
    report("wrote", buildTypes());
    report("wrote", buildRegistry());
    report("wrote", buildAudit());
    report("wrote", buildMcpContext());
    report("wrote", buildFigmaData());
    break;
  case "figma":
    report("wrote", buildFigmaData());
    break;
  case "mcp":
    report("wrote", buildMcpContext());
    break;
  case "audit":
    report("wrote", buildAudit());
    break;
  default:
    console.error(`Unknown command "${command}". Use: validate | tokens | types | registry | audit | mcp | figma | all`);
    process.exit(1);
}
