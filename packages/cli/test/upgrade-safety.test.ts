import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { add, diff, init, list, upgrade, type Context } from "../src/commands.ts";
import { CliError, compareVersions, type RegistryItem } from "../src/project.ts";

// Regression tests for problems found while upgrading a real project from 0.2.0 to 0.3.0:
// forgotten conflicts, content changes without version bumps, an older CLI writing over a newer
// project, the motion import looking like an edit, and a corrupt lock file.

const WIDGET = ["// widget", "export const size = 1;", "export const color = 'red';", ""].join("\n");

const item = (name: string, version: string, files: Record<string, string>, extra: Partial<RegistryItem> = {}): RegistryItem => ({
  name,
  type: name === "tokens" ? "registry:style" : "registry:ui",
  version,
  description: `${name} fixture`,
  dependencies: [],
  registryDependencies: [],
  files: Object.entries(files).map(([p, content]) => ({ path: p, type: "registry:ui", content })),
  ...extra,
});

let root: string;
let cwd: string;
let registryDir: string;
let ctx: Context;

function publish(items: RegistryItem[]) {
  fs.rmSync(registryDir, { recursive: true, force: true });
  fs.mkdirSync(registryDir, { recursive: true });
  for (const i of items) fs.writeFileSync(path.join(registryDir, `${i.name}.json`), JSON.stringify(i));
  fs.writeFileSync(
    path.join(registryDir, "index.json"),
    JSON.stringify({ items: items.map(({ name, type, version, description }) => ({ name, type, version, description })) }),
  );
}
const publishWidget = (version: string, content: string, tokens = ":root { --x: 1; }\n") =>
  publish([item("tokens", "0.1.0", { "@tokens": tokens }), item("utils", "0.1.0", { "utils/cx.ts": "export const cx = 1;\n" }), item("widget", version, { "widget/widget.tsx": content })]);

const widgetPath = () => path.join(cwd, "src/components/rdloom/widget/widget.tsx");
const tokensPath = () => path.join(cwd, "src/styles/rdloom-tokens.css");
const lockPath = () => path.join(cwd, "rdloom.lock.json");
const lock = () => JSON.parse(fs.readFileSync(lockPath(), "utf8"));
const statuses = (name: string) => Object.fromEntries(diff(ctx, [name])[0].files.map((f) => [f.path, f.status]));

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "rdloom-safety-"));
  cwd = path.join(root, "app");
  registryDir = path.join(root, "registry");
  fs.mkdirSync(cwd);
  fs.writeFileSync(path.join(cwd, "package.json"), "{}");
  ctx = { cwd, registryDir, cliVersion: "0.3.0", out: { info: () => {}, warn: () => {} }, run: () => 0 };
  publishWidget("0.1.0", WIDGET);
  init(ctx);
  add(ctx, ["widget"]);
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

/** An upgrade that conflicts: you changed `size`, upstream changed it too. */
function conflictedUpgrade() {
  fs.writeFileSync(widgetPath(), WIDGET.replace("size = 1", "size = 2"));
  publishWidget("0.2.0", WIDGET.replace("size = 1", "size = 3"));
  return upgrade(ctx, []);
}

describe("conflicts left in a file", () => {
  it("are still reported by diff and upgrade after the first upgrade", () => {
    expect(conflictedUpgrade().conflicts).toHaveLength(1);
    expect(fs.readFileSync(widgetPath(), "utf8")).toContain("<<<<<<< yours");

    expect(statuses("widget")["widget/widget.tsx"]).toBe("unresolved");
    const again = upgrade(ctx, []);
    expect(again.conflicts).toEqual(["src/components/rdloom/widget/widget.tsx"]);
    // The markers are left as they are, not merged over or duplicated.
    expect(fs.readFileSync(widgetPath(), "utf8").match(/<<<<<<< yours/g)).toHaveLength(1);
  });

  it("stop being reported once you resolve them", () => {
    conflictedUpgrade();
    fs.writeFileSync(widgetPath(), WIDGET.replace("size = 1", "size = 4"));
    expect(statuses("widget")["widget/widget.tsx"]).toBe("modified");
    expect(upgrade(ctx, []).conflicts).toEqual([]);
  });
});

describe("content changes without a version bump", () => {
  it("show as outdated in list", () => {
    expect(list(ctx).find((i) => i.name === "widget")).toMatchObject({ installed: "0.1.0", outdated: false });
    publishWidget("0.1.0", WIDGET.replace("red", "blue"));
    expect(list(ctx).find((i) => i.name === "widget")).toMatchObject({ installed: "0.1.0", outdated: true });
  });

  it("show as outdated when the version changes too", () => {
    publishWidget("0.2.0", WIDGET);
    expect(list(ctx).find((i) => i.name === "widget")?.outdated).toBe(true);
  });
});

describe("an older CLI on a newer project", () => {
  it("stamps the lock with the CLI that wrote it", () => {
    expect(lock().cli).toBe("0.3.0");
  });

  it("refuses to upgrade, and --force allows it", () => {
    publishWidget("0.1.0", WIDGET.replace("red", "blue"));
    upgrade(ctx, []);
    const older: Context = { ...ctx, cliVersion: "0.2.0" };
    expect(() => upgrade(older, [])).toThrow(/last upgraded with rdloom 0\.3\.0/);
    expect(() => upgrade(older, [], { force: true })).not.toThrow();
    expect(lock().cli).toBe("0.3.0"); // never lowered
  });

  it("lets a newer CLI through and raises the stamp", () => {
    upgrade({ ...ctx, cliVersion: "0.4.0" }, []);
    expect(lock().cli).toBe("0.4.0");
  });

  it("compares versions numerically", () => {
    expect(compareVersions("0.10.0", "0.9.0")).toBeGreaterThan(0);
    expect(compareVersions("1.0.0-beta", "1.0.0")).toBe(0);
  });
});

describe("a corrupt lock file", () => {
  it("fails with a message, not a stack trace", () => {
    fs.writeFileSync(lockPath(), "{ not json");
    expect(() => list(ctx)).toThrow(CliError);
    expect(() => diff(ctx, [])).toThrow(/rdloom\.lock\.json: it isn't valid JSON/);
  });
});

describe("the motion import in the tokens file", () => {
  const REGISTRY = fileURLToPath(new URL("../registry", import.meta.url));

  it("is not counted as your edit, and survives an upgrade of the tokens", () => {
    const real: Context = { ...ctx, registryDir: REGISTRY };
    fs.rmSync(path.join(cwd, "src"), { recursive: true });
    fs.rmSync(lockPath());
    fs.rmSync(path.join(cwd, ".rdloom"), { recursive: true });
    init(real);
    add(real, ["gradient-button"]);
    expect(fs.readFileSync(tokensPath(), "utf8")).toContain('@import "./rdloom-motion.css";');

    const tokens = diff(real, ["tokens"])[0].files;
    expect(tokens.map((f) => f.status)).toEqual(["unchanged"]);
    expect(lock().items.tokens).toBeDefined();
  });

  it("is kept when the tokens file is replaced by an upgrade", () => {
    // Fixture tokens, with the import `add` writes for a motion component placed on top.
    fs.writeFileSync(tokensPath(), `@import "./rdloom-motion.css";\n${fs.readFileSync(tokensPath(), "utf8")}`);
    expect(statuses("tokens")["@tokens"]).toBe("unchanged");
    publishWidget("0.1.0", WIDGET, ":root { --x: 2; }\n");
    expect(statuses("tokens")["@tokens"]).toBe("update");
    upgrade(ctx, []);
    expect(fs.readFileSync(tokensPath(), "utf8")).toBe('@import "./rdloom-motion.css";\n:root { --x: 2; }\n');
  });

  it("still reports a real edit to the tokens", () => {
    fs.writeFileSync(tokensPath(), `@import "./rdloom-motion.css";\n:root { --x: 9; }\n`);
    expect(statuses("tokens")["@tokens"]).toBe("modified");
  });
});
