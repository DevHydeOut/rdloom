import fs from "node:fs";
import path from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import { examplesDir, schemaFile } from "./paths.ts";
import { kebab, loadSpecs } from "./specs.ts";
import { loadTokens, semanticPaths } from "./tokens.ts";

export interface ValidationResult {
  file: string;
  errors: string[];
}

export function validateSpecs(): ValidationResult[] {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const check = ajv.compile(JSON.parse(fs.readFileSync(schemaFile, "utf8")));
  const knownTokens = semanticPaths(loadTokens());

  return loadSpecs().map(({ file, raw, spec }) => {
    const errors: string[] = [];

    if (!check(raw)) {
      for (const e of check.errors ?? []) errors.push(`schema: ${e.instancePath || "/"} ${e.message}`);
      return { file, errors }; // the rule checks below assume a schema-valid spec
    }

    const expectedFile = `${kebab(spec.name)}.spec.json`;
    if (path.basename(file) !== expectedFile) errors.push(`file should be named ${expectedFile}`);

    for (const [name, prop] of Object.entries(spec.props)) {
      if (prop.type === "enum" && prop.default !== undefined && !prop.values!.includes(String(prop.default))) {
        errors.push(`props.${name}: default "${prop.default}" is not one of ${prop.values!.join(", ")}`);
      }
      if (prop.type === "boolean" && prop.default !== undefined && typeof prop.default !== "boolean") {
        errors.push(`props.${name}: default must be a boolean`);
      }
    }

    for (const v of spec.variants ?? []) {
      const prop = spec.props[v];
      if (!prop) errors.push(`variants: "${v}" is not a prop`);
      else if (prop.type !== "enum" && prop.type !== "boolean") errors.push(`variants: "${v}" must be an enum or boolean prop`);
    }

    if (!spec.a11y.screenReader?.length) {
      errors.push("a11y.screenReader: list what a screen reader user should hear; it feeds docs/accessibility-audit.md");
    }

    // Each listed example is a real file: the docs site renders it, the MCP
    // server serves its code, and a test renders it with axe.
    const dir = path.join(examplesDir, kebab(spec.name));
    const onDisk = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".tsx")).map((f) => f.slice(0, -4)) : [];
    for (const e of spec.examples ?? []) {
      if (!onDisk.includes(e)) errors.push(`examples: "${e}" has no file examples/components/${kebab(spec.name)}/${e}.tsx`);
    }
    for (const f of onDisk) {
      if (!(spec.examples ?? []).includes(f)) errors.push(`examples: examples/components/${kebab(spec.name)}/${f}.tsx is not listed in the spec`);
    }

    for (const t of spec.tokens ?? []) {
      if (!knownTokens.has(t)) errors.push(`tokens: "${t}" is not a semantic token`);
    }
    const seenTokens = new Set<string>();
    for (const t of spec.tokens ?? []) {
      if (seenTokens.has(t)) errors.push(`tokens: "${t}" is listed twice`);
      seenTokens.add(t);
    }

    for (const key of Object.keys(spec.figma?.variantMap ?? {})) {
      if (!(spec.variants ?? []).includes(key)) errors.push(`figma.variantMap: "${key}" is not listed in variants`);
    }

    return { file, errors };
  });
}
