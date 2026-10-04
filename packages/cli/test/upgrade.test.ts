import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { add, diff, init, upgrade, type Context } from "../src/commands.ts";
import { CliError, type RegistryItem } from "../src/project.ts";

// Each test gets a fresh project and a tiny registry it controls, so
// "upstream" changes are exactly what the test says they are.

const WIDGET_V1 = [
  "// widget",
  'import { cx } from "../utils/cx";',
  "export const size = 1;",
  "export const label = 'Widget';",
  'export const color = "red";',
  "export const done = true;",
  "",
].join("\n");

const item = (name: string, version: string, files: Record<string, string>, extra: Partial<RegistryItem> = {}): RegistryItem => ({
  name,
  type: name === "tokens" ? "registry:style" : name === "utils" ? "registry:lib" : "registry:ui",
  version,
  description: `${name} fixture`,
  dependencies: [],
  registryDependencies: [],
  files: Object.entries(files).map(([p, content]) => ({ path: p, type: "registry:ui", content })),
  ...extra,
});

const baseItems = () => [
  item("tokens", "0.1.0", { "@tokens": ":root { --x: 1; }\n" }),
  item("utils", "0.1.0", { "utils/cx.ts": "export const cx = (...c: string[]) => c.join(' ');\n" }),
  item("widget", "0.1.0", { "widget/widget.tsx": WIDGET_V1 }, { registryDependencies: ["utils"], dependencies: ["dep-a@^1.0.0"] }),
];

let root: string;
let cwd: string;
let registryDir: string;
let logs: string[];
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

/** Publishes widget with new content (and optional extra items). */
function publishWidget(version: string, content: string, extra: Partial<RegistryItem> = {}, more: RegistryItem[] = []) {
  const items = baseItems().filter((i) => i.name !== "widget");
  publish([...items, item("widget", version, { "widget/widget.tsx": content }, { registryDependencies: ["utils"], dependencies: ["dep-a@^1.0.0"], ...extra }), ...more]);
}

const widgetPath = () => path.join(cwd, "src/components/rdloom/widget/widget.tsx");
const readWidget = () => fs.readFileSync(widgetPath(), "utf8");
const editWidget = (from: string, to: string) => fs.writeFileSync(widgetPath(), readWidget().replace(from, to));
const lock = () => JSON.parse(fs.readFileSync(path.join(cwd, "rdloom.lock.json"), "utf8"));
const output = () => logs.join("\n");
/** Status of widget.tsx in a diff of everything installed. */
const widgetStatus = () =>
  diff(ctx, [])
    .find((p) => p.name === "widget")!
    .files.find((f) => f.path === "widget/widget.tsx")!.status;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "rdloom-cli-"));
  cwd = path.join(root, "app");
  registryDir = path.join(root, "registry");
  fs.mkdirSync(cwd);
  fs.writeFileSync(path.join(cwd, "package.json"), "{}");
  logs = [];
  ctx = { cwd, registryDir, out: { info: (m) => logs.push(m), warn: (m) => logs.push(m) }, run: () => 0 };
  publish(baseItems());
  init(ctx);
  add(ctx, ["widget"]);
  logs = [];
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe("add", () => {
  it("saves the as-shipped copy as the merge base and records deps in the lock", () => {
    expect(fs.readFileSync(path.join(cwd, ".rdloom/base/widget/widget.tsx"), "utf8")).toBe(WIDGET_V1);
    expect(lock()).toMatchObject({ lockVersion: 2, items: { widget: { version: "0.1.0", dependencies: ["dep-a@^1.0.0"] } } });
  });

  it("leaves installed components alone and points to upgrade", () => {
    editWidget("size = 1", "size = 2");
    publishWidget("0.2.0", WIDGET_V1.replace("red", "blue"));
    add(ctx, ["widget"]);
    expect(output()).toContain("already installed. Run `rdloom upgrade widget`");
    expect(readWidget()).toContain("size = 2");
    expect(lock().items.widget.version).toBe("0.1.0"); // the base must not jump ahead of the file
  });
});

describe("diff and upgrade", () => {
  it("reports up to date when nothing changed", () => {
    const [plan] = diff(ctx, ["widget"]);
    expect(plan.files.every((f) => f.status === "unchanged")).toBe(true);
    expect(output()).toContain("Everything is up to date.");
    expect(upgrade(ctx, []).changed).toBe(0);
  });

  it("replaces a file you didn't touch", () => {
    publishWidget("0.2.0", WIDGET_V1.replace("red", "blue"));
    expect(diff(ctx, ["widget"])[0].files[0].status).toBe("update");

    const result = upgrade(ctx, ["widget"]);
    expect(result).toEqual({ conflicts: [], changed: 1 });
    expect(readWidget()).toBe(WIDGET_V1.replace("red", "blue"));
    expect(lock().items.widget.version).toBe("0.2.0");
    expect(fs.readFileSync(path.join(cwd, ".rdloom/base/widget/widget.tsx"), "utf8")).toContain("blue");
  });

  it("keeps your edit when upstream didn't change the file", () => {
    editWidget("size = 1", "size = 2");
    publishWidget("0.2.0", WIDGET_V1);
    expect(widgetStatus()).toBe("modified");
    upgrade(ctx, []);
    expect(readWidget()).toContain("size = 2");
    expect(lock().items.widget.version).toBe("0.2.0");
  });

  it("merges your edit and upstream's when they touch different lines", () => {
    editWidget("size = 1", "size = 2");
    publishWidget("0.2.0", WIDGET_V1.replace("red", "blue"));
    expect(widgetStatus()).toBe("merge");

    const result = upgrade(ctx, []);
    expect(result.conflicts).toEqual([]);
    expect(readWidget()).toContain("size = 2");
    expect(readWidget()).toContain('color = "blue"');
    expect(readWidget()).not.toContain("<<<<<<<");
  });

  it("writes labelled conflict markers when both change the same line", () => {
    editWidget('color = "red"', 'color = "green"');
    publishWidget("0.2.0", WIDGET_V1.replace("red", "blue"));
    expect(widgetStatus()).toBe("conflict");

    const result = upgrade(ctx, []);
    expect(result.conflicts).toEqual(["src/components/rdloom/widget/widget.tsx"]);
    expect(readWidget()).toContain(
      ['<<<<<<< yours', 'export const color = "green";', "||||||| base", 'export const color = "red";', "=======", 'export const color = "blue";', ">>>>>>> rdloom 0.2.0"].join("\n"),
    );
    expect(output()).toContain("CONFLICT");

    // After resolving, the next upgrade compares against 0.2.0, not 0.1.0.
    fs.writeFileSync(widgetPath(), WIDGET_V1.replace("red", "green"));
    logs = [];
    expect(widgetStatus()).toBe("modified");
  });

  it("doesn't conflict when you already made the same change", () => {
    editWidget("red", "blue");
    publishWidget("0.2.0", WIDGET_V1.replace("red", "blue"));
    expect(widgetStatus()).toBe("unchanged");
    expect(upgrade(ctx, []).conflicts).toEqual([]);
  });

  it("adds new files, new component dependencies and reports new npm dependencies", () => {
    const helpers = item("helpers", "0.1.0", { "helpers/format.ts": "export const format = String;\n" });
    const items = baseItems().filter((i) => i.name !== "widget");
    publish([
      ...items,
      helpers,
      item(
        "widget",
        "0.2.0",
        { "widget/widget.tsx": WIDGET_V1, "widget/widget.css": ".widget {}\n" },
        { registryDependencies: ["utils", "helpers"], dependencies: ["dep-a@^1.0.0", "dep-b@^2.0.0"] },
      ),
    ]);

    upgrade(ctx, []);
    expect(fs.readFileSync(path.join(cwd, "src/components/rdloom/widget/widget.css"), "utf8")).toBe(".widget {}\n");
    expect(fs.existsSync(path.join(cwd, "src/components/rdloom/helpers/format.ts"))).toBe(true);
    expect(lock().items.helpers.version).toBe("0.1.0");
    expect(output()).toContain('npm install "dep-b@^2.0.0"'); // only the new one, quoted for any shell
    expect(output()).not.toContain("dep-a");
  });

  it("keeps a file the new version no longer ships", () => {
    const items = baseItems().filter((i) => i.name !== "widget");
    publish([...items, item("widget", "0.2.0", { "widget/index.ts": "export {};\n" }, { registryDependencies: ["utils"] })]);
    upgrade(ctx, []);
    expect(fs.existsSync(widgetPath())).toBe(true);
    expect(fs.existsSync(path.join(cwd, ".rdloom/base/widget/widget.tsx"))).toBe(false);
    expect(output()).toContain("no longer shipped");
  });

  it("doesn't restore a file you deleted", () => {
    fs.rmSync(widgetPath());
    publishWidget("0.2.0", WIDGET_V1.replace("red", "blue"));
    upgrade(ctx, []);
    expect(fs.existsSync(widgetPath())).toBe(false);
    expect(output()).toContain("you deleted it");
  });

  it("keeps Windows line endings when merging", () => {
    fs.writeFileSync(widgetPath(), WIDGET_V1.replace("size = 1", "size = 2").replace(/\n/g, "\r\n"));
    publishWidget("0.2.0", WIDGET_V1.replace("red", "blue"));
    upgrade(ctx, []);
    const text = readWidget();
    expect(text).toContain('size = 2;\r\nexport const label');
    expect(text).toContain('color = "blue";\r\n');
    expect(text.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("writes nothing on --dry-run", () => {
    editWidget("size = 1", "size = 2");
    publishWidget("0.2.0", WIDGET_V1.replace("red", "blue"));
    const before = readWidget();
    const result = upgrade(ctx, [], { dryRun: true });
    expect(result.changed).toBe(1);
    expect(readWidget()).toBe(before);
    expect(lock().items.widget.version).toBe("0.1.0");
    expect(output()).toContain("would merge");
  });

  it("shows your changes and upstream's as patches", () => {
    editWidget("size = 1", "size = 2");
    publishWidget("0.2.0", WIDGET_V1.replace("red", "blue"));
    diff(ctx, [], { patch: true });
    expect(output()).toContain("-export const size = 1;");
    expect(output()).toContain("+export const size = 2;");
    expect(output()).toContain('+export const color = "blue";');
  });

  it("rejects components that aren't installed", () => {
    expect(() => diff(ctx, ["nope"])).toThrow(CliError);
  });
});

describe("projects installed before merge bases existed", () => {
  beforeEach(() => {
    fs.rmSync(path.join(cwd, ".rdloom"), { recursive: true });
    const l = lock();
    delete l.lockVersion;
    delete l.items.widget.dependencies;
    fs.writeFileSync(path.join(cwd, "rdloom.lock.json"), JSON.stringify(l));
  });

  it("still updates files you didn't touch (known by hash)", () => {
    publishWidget("0.2.0", WIDGET_V1.replace("red", "blue"));
    upgrade(ctx, []);
    expect(readWidget()).toContain("blue");
    expect(fs.existsSync(path.join(cwd, ".rdloom/base/widget/widget.tsx"))).toBe(true); // bases from now on
  });

  it("writes the new version next to a file you changed, instead of guessing", () => {
    editWidget("size = 1", "size = 2");
    publishWidget("0.2.0", WIDGET_V1.replace("red", "blue"));
    upgrade(ctx, []);
    expect(readWidget()).toContain("size = 2");
    expect(fs.readFileSync(`${widgetPath()}.upstream`, "utf8")).toContain("blue");
    expect(output()).toContain("merge it into");
  });
});
