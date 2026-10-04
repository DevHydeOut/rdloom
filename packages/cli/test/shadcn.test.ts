import fs from "node:fs";
import { describe, expect, it } from "vitest";
import type { RegistryItem } from "../../codegen/src/registry.ts";
import { tokenStyles, toShadcn } from "../../codegen/src/shadcn.ts";

// The shadcn-format registry the docs site serves at /r/. Checked against the
// built rdloom registry, so it covers every real item. (Installing with the
// real shadcn CLI was checked by hand: files, npm deps and CSS all land.)

const dir = new URL("../registry/", import.meta.url);
const items: RegistryItem[] = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".json") && f !== "index.json")
  .map((f) => JSON.parse(fs.readFileSync(new URL(f, dir), "utf8")));

describe("shadcn registry", () => {
  it("keeps our folder layout under the components alias", () => {
    const button = toShadcn(items.find((i) => i.name === "button")!);
    expect(button.$schema).toBe("https://ui.shadcn.com/schema/registry-item.json");
    expect(button.files.map((f) => f.target)).toEqual(["@components/rdloom/button/button.tsx", "@components/rdloom/generated/button.types.ts"]);
    expect(button.registryDependencies).toEqual(["SITE_URL/r/tokens.json", "SITE_URL/r/utils.json"]);
  });

  it("points every dependency at an item we publish", () => {
    const names = new Set(items.map((i) => i.name));
    for (const item of items) {
      for (const url of toShadcn(item).registryDependencies) expect(names).toContain(url.match(/\/r\/(.+)\.json$/)![1]);
    }
  });

  it("turns tokens into colour cssVars plus plain CSS for the rest", () => {
    const css = `:root {\n  --rd-a: #fff;\n  --rd-radius: 4px;\n}\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n    --rd-a: #000;\n  }\n}\n:root[data-theme="dark"] {\n  --rd-a: #000;\n}\n`;
    expect(tokenStyles(css)).toEqual({
      cssVars: { light: { "rd-a": "#fff" }, dark: { "rd-a": "#000" } },
      css: { "@layer base": { ":root": { "--rd-radius": "4px" } } },
    });
    const tokens = toShadcn(items.find((i) => i.name === "tokens")!) as ReturnType<typeof toShadcn> & { cssVars: { light: object; dark: object } };
    expect(Object.keys(tokens.cssVars.light).length).toBeGreaterThan(20);
    expect(Object.keys(tokens.cssVars.dark).length).toBeGreaterThan(5);
  });
});
