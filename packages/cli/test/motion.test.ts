import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { add, init, type Context } from "../src/commands.ts";

// The motion components share one stylesheet. The CLI installs it beside the tokens CSS and
// imports it from there, so an added effect needs no setup, and a project that never adds
// one never gets the file.

const REGISTRY = fileURLToPath(new URL("../registry", import.meta.url));

let cwd: string;
let messages: string[];
let ctx: Context;

beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), "rdloom-motion-"));
  fs.writeFileSync(path.join(cwd, "package.json"), "{}");
  messages = [];
  ctx = {
    cwd,
    registryDir: REGISTRY,
    out: { info: (m) => messages.push(m), warn: (m) => messages.push(m) },
    run: () => 0,
  };
});
afterEach(() => fs.rmSync(cwd, { recursive: true, force: true }));

const file = (rel: string) => path.join(cwd, rel);
const read = (rel: string) => fs.readFileSync(file(rel), "utf8");
const TOKENS = "src/styles/rdloom-tokens.css";
const MOTION = "src/styles/rdloom-motion.css";

describe("adding a motion component", () => {
  it("writes the motion CSS next to the tokens and imports it from them", () => {
    init(ctx);
    add(ctx, ["shimmer-button"]);
    expect(fs.existsSync(file(MOTION))).toBe(true);
    expect(read(MOTION)).toContain("@keyframes rdm-shimmer");
    expect(read(TOKENS).startsWith('@import "./rdloom-motion.css";')).toBe(true);
    expect(messages.join("\n")).toContain("imports rdloom-motion.css");
  });

  it("brings the plain Button it builds on, and records everything it installed", () => {
    init(ctx);
    add(ctx, ["shimmer-button"]);
    expect(fs.existsSync(file("src/components/rdloom/button/button.tsx"))).toBe(true);
    expect(fs.existsSync(file("src/components/rdloom/shimmer-button/shimmer-button.tsx"))).toBe(true);
    const lock = JSON.parse(read("rdloom.lock.json")).items;
    expect(Object.keys(lock)).toEqual(expect.arrayContaining(["shimmer-button", "button", "motion-css"]));
    // The merge base for `rdloom upgrade`, like every other file.
    expect(fs.existsSync(file(".rdloom/base/@motion.css"))).toBe(true);
  });

  it("imports it once, however many motion components you add", () => {
    init(ctx);
    add(ctx, ["shimmer-button"]);
    add(ctx, ["text-shimmer", "ripple"]);
    expect(read(TOKENS).match(/rdloom-motion\.css/g)).toHaveLength(1);
  });

  it("doesn't put the import back after you take it out", () => {
    init(ctx);
    add(ctx, ["shimmer-button"]);
    fs.writeFileSync(file(TOKENS), read(TOKENS).replace(/@import "\.\/rdloom-motion\.css";\n/, ""));
    add(ctx, ["text-shimmer"]);
    expect(read(TOKENS)).not.toContain("rdloom-motion.css");
  });

  it("keeps the tokens file's line endings", () => {
    init(ctx);
    fs.writeFileSync(file(TOKENS), read(TOKENS).replace(/\n/g, "\r\n"));
    add(ctx, ["pulse-button"]);
    const text = read(TOKENS);
    expect(text.startsWith('@import "./rdloom-motion.css";\r\n')).toBe(true);
    expect(text.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("puts the import after an @charset, where CSS requires it", () => {
    init(ctx);
    fs.writeFileSync(file(TOKENS), `@charset "UTF-8";\n${read(TOKENS)}`);
    add(ctx, ["ripple"]);
    expect(read(TOKENS).startsWith('@charset "UTF-8";\n@import "./rdloom-motion.css";\n')).toBe(true);
  });

  it("follows a custom tokens location", () => {
    init(ctx, { tokensCss: "packages/ui/rdloom.css", componentsDir: "packages/ui/src/rdloom" });
    add(ctx, ["gradient-text"]);
    expect(fs.existsSync(file("packages/ui/rdloom-motion.css"))).toBe(true);
    expect(read("packages/ui/rdloom.css").startsWith('@import "./rdloom-motion.css";')).toBe(true);
  });

  it("says what to do if the tokens file isn't there to import from", () => {
    init(ctx);
    fs.rmSync(file(TOKENS));
    add(ctx, ["shine-border"]);
    expect(fs.existsSync(file(MOTION))).toBe(true);
    expect(messages.join("\n")).toMatch(/Import src\/styles\/rdloom-motion\.css in your global CSS/);
  });
});

describe("a project that doesn't use motion", () => {
  it("never gets the motion CSS, and the tokens file is untouched", () => {
    init(ctx);
    const before = read(TOKENS);
    add(ctx, ["button", "alert"]);
    expect(fs.existsSync(file(MOTION))).toBe(false);
    expect(read(TOKENS)).toBe(before);
    expect(JSON.parse(read("rdloom.lock.json")).items["motion-css"]).toBeUndefined();
  });

  it("gets none for the effects that are plain transitions", () => {
    init(ctx);
    add(ctx, ["blur-fade", "reveal-button"]);
    expect(fs.existsSync(file(MOTION))).toBe(false);
    expect(read(TOKENS)).not.toContain("rdloom-motion.css");
  });
});
