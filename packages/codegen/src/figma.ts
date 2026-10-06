import fs from "node:fs";
import path from "node:path";
import { brand } from "./brand.ts";
import { root, tokensOutDir } from "./paths.ts";
import { kebab, loadSpecs } from "./specs.ts";
import { cssVar } from "./tokens.ts";

// Builds the data the Figma plugin bundles: semantic tokens as Figma
// variables (light and dark modes) and each spec's variants as Figma variant
// properties, named through the spec's figma.variantMap.

export const figmaDataFile = path.join(root, "packages", "figma", "src", "generated", "figma-data.json");

export function buildFigmaData(): string[] {
  const tokens = JSON.parse(fs.readFileSync(path.join(tokensOutDir, "tokens.json"), "utf8"));
  const light: Record<string, { type: string; value: string }> = tokens.modes.light;
  const dark: Record<string, { type: string; value: string }> = tokens.modes.dark;

  const data = {
    collection: brand.displayName,
    // Figma variables are colors and numbers; shadows (elevation) are composite and stay in CSS.
    variables: Object.entries(light).filter(([, t]) => t.type === "color" || t.type === "dimension").map(([p, t]) => ({
      name: p.replace(/\./g, "/"),
      token: p,
      cssVar: cssVar(p),
      type: t.type === "color" ? "COLOR" : "FLOAT",
      light: t.value,
      dark: dark[p]?.value ?? t.value,
    })),
    components: loadSpecs().map(({ spec }) => ({
      name: spec.name,
      id: kebab(spec.name),
      version: spec.version,
      description: spec.description,
      properties: (spec.variants ?? []).map((prop) => {
        const p = spec.props[prop];
        const values = p.type === "boolean" ? ["false", "true"] : p.values!;
        return {
          prop,
          name: spec.figma?.variantMap?.[prop] ?? prop,
          values,
          default: p.default === undefined ? values[0] : String(p.default),
        };
      }),
    })),
  };

  fs.mkdirSync(path.dirname(figmaDataFile), { recursive: true });
  fs.writeFileSync(figmaDataFile, JSON.stringify(data, null, 2) + "\n");
  return [figmaDataFile];
}
