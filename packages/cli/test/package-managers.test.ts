import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { add, init, type Context } from "../src/commands.ts";

// The lockfile decides which package manager we hand the install to. Getting
// it wrong means telling the user to run a command their project does not use,
// or running the wrong one with --install.

const REGISTRY = fileURLToPath(new URL("../registry", import.meta.url));

let cwd: string;
let messages: string[];
let ran: string[][];
let ctx: Context;

beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), "rdloom-pm-"));
  fs.writeFileSync(path.join(cwd, "package.json"), "{}");
  messages = [];
  ran = [];
  ctx = {
    cwd,
    registryDir: REGISTRY,
    out: { info: (m) => messages.push(m), warn: (m) => messages.push(m) },
    run: (cmd) => {
      ran.push(cmd);
      return 0;
    },
  };
});
afterEach(() => fs.rmSync(cwd, { recursive: true, force: true }));

const lock = (name: string) => fs.writeFileSync(path.join(cwd, name), "");

describe("package manager detection", () => {
  it.each([
    ["pnpm-lock.yaml", "pnpm add"],
    ["yarn.lock", "yarn add"],
    ["bun.lockb", "bun add"],
    ["bun.lock", "bun add"], // bun's newer text lockfile
  ])("%s means `%s`", (lockfile, command) => {
    lock(lockfile);
    init(ctx);
    add(ctx, ["button"]);
    expect(messages.join("\n")).toContain(command);
  });

  it("falls back to npm install", () => {
    init(ctx);
    add(ctx, ["button"]);
    expect(messages.join("\n")).toContain("npm install");
  });

  it("prefers pnpm when several lockfiles are present", () => {
    lock("package-lock.json");
    lock("yarn.lock");
    lock("pnpm-lock.yaml");
    init(ctx);
    add(ctx, ["button"]);
    expect(messages.join("\n")).toContain("pnpm add");
  });

  it("runs that package manager for --install, rather than printing it", () => {
    lock("yarn.lock");
    init(ctx);
    add(ctx, ["button"], { install: true });
    expect(ran.at(-1)?.slice(0, 2)).toEqual(["yarn", "add"]);
    expect(ran.at(-1)).toContain("react-aria-components@^1.21.1");
  });

  it("quotes a version range so Windows cmd.exe cannot eat the caret", () => {
    lock("pnpm-lock.yaml");
    init(ctx);
    add(ctx, ["button"]);
    // Unquoted, cmd.exe turns pkg@^1.2.0 into pkg@1.2.0 and pins the floor.
    expect(messages.join("\n")).toContain('"react-aria-components@^1.21.1"');
  });
});
