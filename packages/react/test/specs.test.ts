import fs from "node:fs";
import path from "node:path";
import * as library from "../src";

// Every spec must ship a component, and the generated defaults must match
// the spec. This catches a spec edit that nobody re-ran codegen for.

const specsDir = path.resolve(__dirname, "../../../specs");
const specs = fs
  .readdirSync(specsDir)
  .filter((f) => f.endsWith(".spec.json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(specsDir, f), "utf8")));

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const camel = (name: string) => name[0].toLowerCase() + name.slice(1);

describe.each(specs.map((s) => [s.name, s]))("%s spec", (name, spec) => {
  it("is exported from the package", () => {
    const exported = name === "Toast" ? "ToastRegion" : name;
    expect(library).toHaveProperty(exported);
  });

  it("has generated defaults that match the spec", async () => {
    const generated = await import(`../src/generated/${kebab(name)}.types.ts`);
    const expected = Object.fromEntries(
      Object.entries(spec.props as Record<string, { default?: unknown }>)
        .filter(([, p]) => p.default !== undefined)
        .map(([k, p]) => [k, p.default]),
    );
    expect(generated[`${camel(name)}Defaults`]).toEqual(expected);
    expect(generated[`${camel(name)}Meta`].version).toBe(spec.version);
  });
});
