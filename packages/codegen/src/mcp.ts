import fs from "node:fs";
import path from "node:path";
import { brand } from "./brand.ts";
import { examplesDir, registryDir, root, tokensOutDir } from "./paths.ts";
import { kebab, loadSpecs } from "./specs.ts";
import { cssVar } from "./tokens.ts";

// Builds the context bundle the MCP server serves: every spec with its example code, the resolved
// semantic tokens and the registry files, in one JSON file so the published
// server needs nothing else from this repo.

export const mcpContextFile = path.join(root, "packages", "mcp", "context.json");

const readJson = (file: string) => JSON.parse(fs.readFileSync(file, "utf8"));

export function buildMcpContext(): string[] {
  const tokens = readJson(path.join(tokensOutDir, "tokens.json"));
  const light: Record<string, { type: string; value: string }> = tokens.modes.light;
  const dark: Record<string, { type: string; value: string }> = tokens.modes.dark;

  const registry = (name: string) => readJson(path.join(registryDir, `${name}.json`));

  const components = loadSpecs().map(({ spec }) => {
    const id = kebab(spec.name);
    const item = registry(id);
    return {
      id,
      spec,
      install: {
        command: `npx ${brand.name} add ${id}`,
        dependencies: item.dependencies,
        registryDependencies: item.registryDependencies,
      },
      examples: (spec.examples ?? []).map((name) => ({
        name,
        code: fs.readFileSync(path.join(examplesDir, id, `${name}.tsx`), "utf8"),
      })),
      files: item.files.map((f: { path: string; content: string }) => ({ path: f.path, content: f.content })),
    };
  });

  const context = {
    brand: { name: brand.name, displayName: brand.displayName, cssPrefix: brand.cssPrefix },
    components,
    tokens: Object.entries(light).map(([p, t]) => ({
      path: p,
      cssVar: cssVar(p),
      type: t.type,
      light: t.value,
      dark: dark[p]?.value ?? t.value,
    })),
    shared: ["tokens", "utils"].map((name) => {
      const item = registry(name);
      return { name, files: item.files.map((f: { path: string; content: string }) => ({ path: f.path, content: f.content })) };
    }),
  };

  fs.writeFileSync(mcpContextFile, JSON.stringify(context, null, 2) + "\n");
  return [mcpContextFile];
}
