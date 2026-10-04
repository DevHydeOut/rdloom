import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

export const root = path.resolve(here, "../../..");
export const specsDir = path.join(root, "specs");
export const schemaFile = path.join(specsDir, "schema", "component.schema.json");
export const tokensDir = path.join(root, "tokens");
export const tokensOutDir = path.join(root, "packages", "tokens", "dist");
export const reactGeneratedDir = path.join(root, "packages", "react", "src", "generated");
/** One file per spec example: examples/components/<kebab-name>/<example>.tsx */
export const examplesDir = path.join(root, "examples", "components");
export const registryDir = path.join(root, "packages", "cli", "registry");
