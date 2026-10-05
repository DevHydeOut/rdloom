import fs from "node:fs";
import path from "node:path";
import { brand, siteUrl } from "./brand.ts";
import { root } from "./paths.ts";
import type { RegistryItem } from "./registry.ts";

// The same items in the shadcn registry format, served by the docs site at
// /r/<name>.json, so shadcn projects can install rdloom components:
//
//   npx shadcn@latest add <site>/r/button.json
//
// or, with "registries": { "@rdloom": "<site>/r/{name}.json" } in
// components.json, `npx shadcn@latest add @rdloom/button`.
//
// <site> comes from SITE_URL at build time. Until the docs are hosted it is
// empty, and the generated files carry a placeholder rather than a real URL.
//
// Differences from our own registry:
// - Files land under the project's components alias (`@components/rdloom/...`)
//   with our folder layout, so the relative imports between them still work.
// - Tokens become cssVars, which shadcn writes into the project's global CSS:
//   light values on :root and dark values on .dark, shadcn's dark-mode class.
// - Dependencies on our own items are full URLs; bare names mean shadcn's.

export const shadcnDir = path.join(root, "apps", "docs", "public", "r");
const SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";

/** Stands in for the docs URL until the site is hosted, so no real domain is implied. */
export const SITE_PLACEHOLDER = "SITE_URL";
const base = () => siteUrl || SITE_PLACEHOLDER;
const itemUrl = (name: string) => `${base()}/r/${name}.json`;

/** `--rd-x: 1px;` declarations inside the first block that `selector` opens. */
function declarations(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`tokens.css has no "${selector}" block`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

const isColor = (value: string) => /^(#|rgb|hsl|oklch|color-mix)/.test(value);
const pick = (vars: Record<string, string>, color: boolean) =>
  Object.fromEntries(Object.entries(vars).filter(([, v]) => isColor(v) === color));

/**
 * Colours go in cssVars: shadcn writes them to :root and .dark and maps each
 * to a Tailwind colour (`bg-rd-color-action-primary`). Radius, spacing and the
 * rest are the same in both modes and aren't colours, so they go in plain CSS.
 */
export function tokenStyles(css: string) {
  const light = declarations(css, ":root");
  const dark = declarations(css, ':root[data-theme="dark"]');
  const other = Object.fromEntries(Object.entries(pick(light, false)).map(([k, v]) => [`--${k}`, v]));
  return {
    cssVars: { light: pick(light, true), dark: pick(dark, true) },
    css: { "@layer base": { ":root": other } },
  };
}

export function toShadcn(item: RegistryItem) {
  const base = {
    $schema: SCHEMA,
    name: item.name,
    type: item.type === "registry:style" ? "registry:theme" : item.type,
    title: item.name,
    description: item.description,
    dependencies: item.dependencies,
    registryDependencies: item.registryDependencies.map(itemUrl),
    meta: { version: item.version, source: brand.name },
  };
  if (item.name === "tokens") {
    return { ...base, ...tokenStyles(item.files[0].content), files: [] };
  }
  if (item.name === "motion-css") {
    // A stylesheet to import yourself: that CLI writes files but does not edit your CSS.
    return {
      ...base,
      type: "registry:file",
      files: item.files.map((f) => ({
        path: `registry/${brand.name}/motion/rdloom-motion.css`,
        type: "registry:file",
        target: "~/src/styles/rdloom-motion.css",
        content: f.content,
      })),
    };
  }
  return {
    ...base,
    files: item.files.map((f) => ({
      path: `registry/${brand.name}/${f.path}`,
      type: f.type,
      target: `@components/${brand.name}/${f.path}`,
      content: f.content,
    })),
  };
}

export function buildShadcnRegistry(items: RegistryItem[]): string[] {
  fs.rmSync(shadcnDir, { recursive: true, force: true });
  fs.mkdirSync(shadcnDir, { recursive: true });
  const written = items.map((item) => {
    const file = path.join(shadcnDir, `${item.name}.json`);
    fs.writeFileSync(file, JSON.stringify(toShadcn(item), null, 2) + "\n");
    return file;
  });

  // The index, in shadcn's registry.json shape (items without file contents).
  const index = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: brand.name,
    homepage: siteUrl || brand.repoUrl,
    items: items.map((item) => {
      const { $schema: _, ...full } = toShadcn(item);
      return { ...full, files: full.files.map(({ content: _c, ...f }) => f) };
    }),
  };
  const indexFile = path.join(shadcnDir, "registry.json");
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2) + "\n");
  return [...written, indexFile];
}
