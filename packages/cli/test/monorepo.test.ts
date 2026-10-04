import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { add, diff, init, type Context } from "../src/commands.ts";
import { Project, workspaceProjects } from "../src/project.ts";

// Monorepos: commands work from any directory, and one workspace can hold the
// components for every app.

const REGISTRY = fileURLToPath(new URL("../registry", import.meta.url));

let root: string;
const at = (...parts: string[]) => path.join(root, ...parts);
const ctx = (cwd: string): Context => ({ cwd, registryDir: REGISTRY, out: { info: () => {}, warn: () => {} } });
const write = (rel: string, text: string) => {
  fs.mkdirSync(path.dirname(at(rel)), { recursive: true });
  fs.writeFileSync(at(rel), text);
};

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "rdloom-mono-"));
  write("package.json", JSON.stringify({ name: "mono", workspaces: ["apps/*", "packages/ui"] }));
  write("apps/web/package.json", JSON.stringify({ name: "web" }));
  write("apps/admin/package.json", JSON.stringify({ name: "admin" }));
  write("packages/ui/package.json", JSON.stringify({ name: "@repo/ui" }));
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe("finding the project", () => {
  it("uses the nearest rdloom.json at or above the working directory", () => {
    init(ctx(at("apps/web")));
    fs.mkdirSync(at("apps/web/src/features/billing"), { recursive: true });
    const deep = new Project(at("apps/web/src/features/billing"));
    expect(deep.root).toBe(at("apps/web"));
    expect(add(ctx(at("apps/web/src/features/billing")), ["button"]).added).toContain("button");
    expect(fs.existsSync(at("apps/web/src/components/rdloom/button/button.tsx"))).toBe(true);
    // One lock for the project, wherever the command ran.
    expect(fs.existsSync(at("apps/web/rdloom.lock.json"))).toBe(true);
  });

  it("names the workspaces that are set up when the root has no config", () => {
    init(ctx(at("apps/web")));
    init(ctx(at("packages/ui")));
    expect(workspaceProjects(root)).toEqual(["apps/web", "packages/ui"]);
    expect(() => add(ctx(root), ["button"])).toThrow(/monorepo; rdloom is set up in: apps\/web, packages\/ui/);
    expect(() => add(ctx(root), ["button"])).toThrow(/--cwd apps\/web/);
  });

  it("still reports a plain missing config outside a workspace", () => {
    fs.rmSync(at("package.json"));
    expect(() => add(ctx(root), ["button"])).toThrow(/no rdloom.json here or above\. Run `rdloom init`/);
  });

  it("reads pnpm-workspace.yaml too", () => {
    fs.rmSync(at("package.json"));
    write("package.json", JSON.stringify({ name: "mono" }));
    write("pnpm-workspace.yaml", "packages:\n  - 'apps/*'\n  - packages/ui\n");
    init(ctx(at("apps/admin")));
    expect(workspaceProjects(root)).toEqual(["apps/admin"]);
  });
});

describe("one shared copy for every app", () => {
  it("installs into a workspace package from anywhere in the repo", () => {
    init(ctx(root), { componentsDir: "packages/ui/src/rdloom", tokensCss: "packages/ui/src/rdloom.css" });
    add(ctx(at("apps/web/src")), ["data-grid"]);

    expect(fs.existsSync(at("packages/ui/src/rdloom/data-grid/data-grid.tsx"))).toBe(true);
    expect(fs.existsSync(at("packages/ui/src/rdloom.css"))).toBe(true);
    // The lock and merge bases stay at the root, shared by every app.
    expect(fs.existsSync(at("rdloom.lock.json"))).toBe(true);
    expect(fs.existsSync(at("apps/web/rdloom.lock.json"))).toBe(false);

    // A second app sees the same installation.
    const plans = diff(ctx(at("apps/admin")), []);
    expect(plans.map((p) => p.name)).toContain("data-grid");
    expect(plans.every((p) => p.files.every((f) => f.status === "unchanged"))).toBe(true);
  });

  it("init sets up the directory it runs in, even under a configured root", () => {
    init(ctx(root), { componentsDir: "packages/ui/src/rdloom", tokensCss: "packages/ui/src/rdloom.css" });
    init(ctx(at("apps/web")));
    expect(fs.existsSync(at("apps/web/rdloom.json"))).toBe(true);
    expect(new Project(at("apps/web")).root).toBe(at("apps/web"));
  });

  it("points out the shared option at a workspace root", () => {
    const messages: string[] = [];
    const result = init({ ...ctx(root), out: { info: (m) => messages.push(m), warn: () => {} } });
    expect(result.workspaceRoot).toBe(true);
    expect(messages.join("\n")).toContain("looks like a monorepo root");
    // Not shown when the layout was chosen explicitly.
    fs.rmSync(at("rdloom.json"));
    expect(init(ctx(root), { componentsDir: "packages/ui/src/rdloom" }).workspaceRoot).toBe(false);
  });
});
