import { describe, expect, it } from "vitest";
import data from "../src/generated/figma-data.json";
import { blueprintFor, hasBlueprint, tokensIn, type BpFrame, type BpNode } from "../src/blueprint.ts";
import { parseColor, parseDimension, parseVariantName, variantCombos, variantName, type FigmaData } from "../src/plan.ts";
import { buildComponents, PAGE_NAME, syncVariables } from "../src/sync.ts";
import { fakeFigma, type FakeNode } from "./fake-figma.ts";

const spec = data as FigmaData;
const button = spec.components.find((c) => c.name === "Button")!;
const pageOf = (root: FakeNode) => root.children.find((p) => p.name === PAGE_NAME)!;

describe("plan", () => {
  it("parses token colors to Figma channels", () => {
    expect(parseColor("#ffffff")).toEqual({ r: 1, g: 1, b: 1, a: 1 });
    expect(parseColor("#f00")).toEqual({ r: 1, g: 0, b: 0, a: 1 });
    expect(parseColor("#00000080").a).toBeCloseTo(0.5, 2);
    expect(parseColor("rgb(0 0 0 / 0.5)")).toEqual({ r: 0, g: 0, b: 0, a: 0.5 });
    expect(parseColor("rgba(255, 0, 0, 40%)")).toEqual({ r: 1, g: 0, b: 0, a: 0.4 });
    expect(() => parseColor("red")).toThrow();
    for (const v of spec.variables.filter((v) => v.type === "COLOR")) {
      expect(() => [parseColor(v.light), parseColor(v.dark)]).not.toThrow();
    }
    expect(parseDimension("8px")).toBe(8);
    expect(parseDimension("0.5rem")).toBe(8);
  });

  it("names variants the way Figma does, from the spec's variantMap", () => {
    const combos = variantCombos(button.properties);
    expect(combos).toHaveLength(4 * 3 * 2);
    expect(variantName(button.properties, combos[0])).toBe("Variant=primary, Size=md, Disabled=false");
    expect(parseVariantName(button.properties, "Variant=ghost, Size=lg, Disabled=true")).toEqual({ variant: "ghost", size: "lg", isDisabled: "true" });
    expect(parseVariantName(button.properties, "Something else")).toBeNull();
    expect(variantCombos(button.properties, 5)).toHaveLength(5);
  });

  it("has a blueprint for every component, using only tokens that exist", () => {
    const tokens = new Set(spec.variables.map((v) => v.token));
    for (const c of spec.components) {
      expect(hasBlueprint(c.name), `${c.name} needs a blueprint in blueprint.ts`).toBe(true);
      for (const combo of variantCombos(c.properties)) {
        for (const t of tokensIn(blueprintFor(c, combo))) expect(tokens, `${c.name}: ${t}`).toContain(t);
      }
    }
  });

  it("reflects the variant in the blueprint", () => {
    expect(blueprintFor(button, { variant: "danger", size: "sm", isDisabled: "true" })).toMatchObject({ fill: "color.action.danger", h: 32, opacity: 0.5 });
    const texts = (n: BpNode): string[] => (n.kind === "text" ? [n.text] : n.kind === "frame" ? n.children.flatMap(texts) : []);
    const field = spec.components.find((c) => c.name === "TextField")!;
    expect(texts(blueprintFor(field, { size: "md", multiline: "false", isDisabled: "false", isInvalid: "true" }))).toContain("Error message");
    expect(texts(blueprintFor(field, { size: "md", multiline: "false", isDisabled: "false", isInvalid: "false" }))).not.toContain("Error message");
    const grid = spec.components.find((c) => c.name === "DataGrid")!;
    const rows = (n: BpFrame) => n.children.filter((c) => c.kind === "frame" && c.name === "row") as BpFrame[];
    expect(rows(blueprintFor(grid, { density: "compact", selectionMode: "none" }))[0].h).toBe(32);
    expect(rows(blueprintFor(grid, { density: "comfortable", selectionMode: "none" }))[0].h).toBe(48);
  });
});

describe("sync variables", () => {
  it("creates a collection with Light and Dark modes and CSS code syntax", async () => {
    const f = fakeFigma();
    const r = await syncVariables(f.api, spec);
    expect(r.created).toHaveLength(spec.variables.length);
    expect(f.collections[0].modes.map((m: { name: string }) => m.name)).toEqual(["Light", "Dark"]);
    const primary = f.variables.find((v) => v.name === "color/action/primary");
    expect(primary.codeSyntax.WEB).toBe("var(--rd-color-action-primary)");
    expect(primary.valuesByMode.m0).not.toEqual(primary.valuesByMode.m1);
    expect(f.variables.find((v) => v.name === "radius/control").valuesByMode.m0).toBe(10);
  });

  it("updates in place on a second run and reports stale variables", async () => {
    const f = fakeFigma();
    await syncVariables(f.api, spec);
    const r = await syncVariables(f.api, { ...spec, variables: spec.variables.slice(1) });
    expect(f.collections).toHaveLength(1);
    expect(f.variables).toHaveLength(spec.variables.length);
    expect(r.created).toHaveLength(0);
    expect(r.stale).toEqual([spec.variables[0].name]);
  });
});

describe("build components", () => {
  it("needs the variables first", async () => {
    await expect(buildComponents(fakeFigma().api, spec)).rejects.toThrow(/Sync variables/);
  });

  it("makes one component set per spec, bound to variables", async () => {
    const f = fakeFigma();
    await syncVariables(f.api, spec);
    const r = await buildComponents(f.api, spec);
    const page = pageOf(f.root);
    expect(page.children).toHaveLength(spec.components.length);
    expect(Object.keys(r.keys)).toHaveLength(spec.components.length);

    const set = page.children.find((n) => n.name === "Button")!;
    expect(set.type).toBe("COMPONENT_SET");
    expect(set.children).toHaveLength(24);
    const primary = set.children.find((c) => c.name === "Variant=primary, Size=md, Disabled=false")!;
    const primaryVar = f.variables.find((v) => v.name === "color/action/primary");
    expect(primary.fills).toEqual([expect.objectContaining({ boundVariables: { color: { type: "VARIABLE_ALIAS", id: primaryVar.id } } })]);
    expect(primary.bound.topLeftRadius).toBe(f.variables.find((v) => v.name === "radius/control").id);
    expect(set.description).toContain("specs/button.spec.json");
  });

  it("keeps designers' edits and only adds missing variants on re-run", async () => {
    const f = fakeFigma();
    await syncVariables(f.api, spec);
    await buildComponents(f.api, spec);
    const page = pageOf(f.root);
    const set = page.children.find((n) => n.name === "Button")!;
    const edited = set.children[0];
    edited.fills = ["designer fill"];
    set.children.pop(); // a designer deleted one variant

    const r = await buildComponents(f.api, spec);
    expect(r.created).toEqual([expect.stringMatching(/^Button: /)]);
    expect(set.children).toHaveLength(24);
    expect(edited.fills).toEqual(["designer fill"]);
    expect(page.children).toHaveLength(spec.components.length);
  });
});
