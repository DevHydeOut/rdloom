import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Every block states what the app can control: which actions it can offer (permissions) and which
// parts take a class name (classNames). The specs are read at test time, so a new block is checked
// the moment its spec exists.

const specsDir = path.resolve(__dirname, "../../../specs");
const blocks = fs
  .readdirSync(specsDir)
  .filter((f) => f.endsWith(".spec.json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(specsDir, f), "utf8")))
  .filter((spec) => spec.category === "block");

// Blocks with no actions to allow or deny, so an empty permissions list is the honest answer.
// Add a block here only with a reason.
const withoutActions: Record<string, string> = {
  "dashboard-page": "a page frame that lays out what the app gives it and offers no action of its own",
  "page-header": "lays out a title and the actions slot the app fills; the actions in it belong to the app",
  "section-header": "lays out a title and the actions slot the app fills; the actions in it belong to the app",
  "app-footer": "links and text only; each link is plain navigation",
  "auth-card": "a card shell around the app's own form; sign-in rules belong to the server",
};

const slug = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const checked = blocks;

describe("block contract", () => {
  it("finds blocks to check", () => {
    expect(checked.length).toBeGreaterThanOrEqual(3);
  });

  it.each(checked.map((spec) => [spec.name, spec] as const))("%s declares classNames with an exact type", (_, spec) => {
    const prop = spec.props.classNames;
    expect(prop, "a block needs a classNames prop").toBeDefined();
    expect(prop.type).toBe("custom");
    expect(prop.description).toBeTruthy();
    expect(prop.tsType).toMatch(/^Partial<Record</);
    // The type names slots the spec lists; a documented subset is allowed, but each name must be a real slot.
    const named = [...prop.tsType.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(named.length).toBeGreaterThan(0);
    for (const slot of named) expect(spec.slots).toContain(slot);
  });

  it.each(checked.map((spec) => [spec.name, spec] as const))("%s declares permissions, or consciously has none", (name, spec) => {
    if (withoutActions[slug(name)]) {
      expect(spec.contract.permissions).toEqual([]);
      return;
    }
    expect(spec.contract.permissions.length, "list the actions, or write per navigation item").toBeGreaterThan(0);
    expect(!!spec.props.permissions || spec.contract.permissions.some((p: string) => /per .*item/.test(p))).toBe(true);
  });

  it.each(checked.map((spec) => [spec.name, spec] as const))("%s says that UI permission is not security", (name, spec) => {
    if (withoutActions[slug(name)]) return;
    expect(JSON.stringify([spec.description, spec.usage]).toLowerCase()).toContain("not security");
  });
});
