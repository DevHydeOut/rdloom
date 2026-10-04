import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { add, diff, init, upgrade, type Context } from "../src/commands.ts";
import { CliError, type RegistryItem } from "../src/project.ts";
import { buildRegistry, validateRegistry } from "../src/registry-build.ts";
import { GitHub, loadRemote, parseSpec, type Fetch, type RemoteSpec } from "../src/remote.ts";

// A fake GitHub: repos are maps of commit -> files, and every request is
// recorded, so tests can check exactly what was sent where.

interface FakeRepo {
  private?: boolean;
  /** ref (branch/tag) -> sha */
  refs: Record<string, string>;
  /** sha -> path -> content */
  commits: Record<string, Record<string, string>>;
}

const TOKEN = "gho_test_token";

function fakeGitHub(repos: Record<string, FakeRepo>) {
  const requests: Array<{ url: string; auth?: string }> = [];
  const fetch: Fetch = async (url, { headers }) => {
    requests.push({ url, auth: headers.Authorization });
    const res = (status: number, body = "") => ({ status, text: async () => body, headers: { get: () => null } });
    const u = new URL(url);
    if (u.host !== "api.github.com") return res(500);
    const m = u.pathname.match(/^\/repos\/([^/]+)\/([^/]+)\/(commits|contents)\/(.+)$/);
    if (!m) return res(404);
    const [, owner, name, kind, rest] = m;
    const repo = repos[`${owner}/${name}`];
    const authed = headers.Authorization === `Bearer ${TOKEN}`;
    if (!repo || (repo.private && !authed)) return res(404);
    if (kind === "commits") {
      const ref = decodeURIComponent(rest);
      const sha = ref === "HEAD" ? repo.refs.main : (repo.refs[ref] ?? (repo.commits[ref] ? ref : undefined));
      return sha ? res(200, sha) : res(422);
    }
    const file = repo.commits[u.searchParams.get("ref") ?? ""]?.[decodeURIComponent(rest)];
    return file === undefined ? res(404) : res(200, file);
  };
  return { requests, github: (token = TOKEN) => new GitHub({ fetch, token: () => token }) };
}

const item = (name: string, version: string, files: Record<string, string>, extra: Partial<RegistryItem> = {}): RegistryItem => ({
  name,
  type: "registry:ui",
  version,
  description: `${name} fixture`,
  dependencies: [],
  registryDependencies: [],
  files: Object.entries(files).map(([p, content]) => ({ path: p, type: "registry:ui", content })),
  ...extra,
});

/** A commit's files for a registry whose built items live in `dir`. */
const registryFiles = (items: RegistryItem[], dir = "registry", manifest = true) => ({
  ...(manifest ? { "rdloom-registry.json": JSON.stringify({ name: "acme", output: dir }) } : {}),
  ...Object.fromEntries(items.map((i) => [`${dir}/${i.name}.json`, JSON.stringify(i)])),
});

// Lines apart, so an upstream edit and a local edit merge cleanly (adjacent
// edits conflict, as in git).
const CARD_V1 = "export const Card = () => 'card v1';\n\nexport const radius = 2;\n\nexport const pad = 4;\n";

let root: string;
let cwd: string;
let registryDir: string;
let logs: string[];
let ctx: Context;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "rdloom-gh-"));
  cwd = path.join(root, "app");
  registryDir = path.join(root, "builtin");
  fs.mkdirSync(cwd, { recursive: true });
  fs.writeFileSync(path.join(cwd, "package.json"), "{}");
  // A tiny built-in registry: tokens, utils and a button.
  fs.mkdirSync(registryDir, { recursive: true });
  const builtin = [
    item("tokens", "0.1.0", { "@tokens": ":root{}\n" }),
    item("utils", "0.1.0", { "utils/cx.ts": "export const cx = 1;\n" }),
    item("button", "0.1.0", { "button/button.tsx": "export const Button = 'builtin';\n" }),
  ];
  for (const i of builtin) fs.writeFileSync(path.join(registryDir, `${i.name}.json`), JSON.stringify(i));
  fs.writeFileSync(path.join(registryDir, "index.json"), JSON.stringify({ items: builtin }));
  logs = [];
  ctx = { cwd, registryDir, out: { info: (m) => logs.push(m), warn: (m) => logs.push(m) }, run: () => 0 };
  init(ctx);
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const lock = () => JSON.parse(fs.readFileSync(path.join(cwd, "rdloom.lock.json"), "utf8"));
const read = (rel: string) => fs.readFileSync(path.join(cwd, "src/components/rdloom", rel), "utf8");
const setRegistries = (registries: Record<string, string>) => {
  const file = path.join(cwd, "rdloom.json");
  fs.writeFileSync(file, JSON.stringify({ ...JSON.parse(fs.readFileSync(file, "utf8")), registries }));
};

/** What index.ts does: fetch the named remote items, then run the command. */
async function withRemote(specs: Array<RemoteSpec | null>, github: GitHub, registries: Record<string, string> = {}) {
  ctx.remote = await loadRemote(specs.filter((s): s is RemoteSpec => s !== null), registries, github);
}

describe("parseSpec", () => {
  it("reads owner/repo/item, refs and namespaces; plain names are built-in", () => {
    expect(parseSpec("button")).toBeNull();
    expect(parseSpec("acme/ui/card")).toMatchObject({ key: "acme/ui/card", prefix: "acme/ui/", item: "card", source: { owner: "acme", repo: "ui" } });
    expect(parseSpec("acme/ui/card#v2")?.source.ref).toBe("v2");
    expect(parseSpec("@acme/card", { "@acme": "acme/ui#main" })).toMatchObject({ key: "@acme/card", source: { owner: "acme", repo: "ui", ref: "main" } });
    expect(() => parseSpec("@nope/card")).toThrow(/unknown registry "@nope"/);
    expect(() => parseSpec("acme/card")).toThrow(CliError);
  });
});

describe("rdloom add from GitHub", () => {
  it("installs from a public repo anonymously, pinned to the commit", async () => {
    const gh = fakeGitHub({ "acme/ui": { refs: { main: "sha1" }, commits: { sha1: registryFiles([item("card", "1.0.0", { "card/card.tsx": CARD_V1 })]) } } });
    await withRemote([parseSpec("acme/ui/card")], gh.github());
    add(ctx, ["acme/ui/card"]);

    expect(read("card/card.tsx")).toBe(CARD_V1);
    expect(lock().items["acme/ui/card"]).toMatchObject({ version: "1.0.0", source: "github:acme/ui", sha: "sha1" });
    expect(gh.requests.every((r) => r.auth === undefined)).toBe(true); // public: no token sent
  });

  it("reads private repos with the token, and only sends it to api.github.com", async () => {
    const gh = fakeGitHub({ "acme/secret": { private: true, refs: { main: "s1" }, commits: { s1: registryFiles([item("vault", "1.0.0", { "vault/vault.tsx": "v\n" })]) } } });
    await withRemote([parseSpec("acme/secret/vault")], gh.github());
    add(ctx, ["acme/secret/vault"]);

    expect(read("vault/vault.tsx")).toBe("v\n");
    expect(gh.requests[0].auth).toBeUndefined(); // tries anonymously first
    expect(gh.requests.some((r) => r.auth === `Bearer ${TOKEN}`)).toBe(true);
    expect(gh.requests.every((r) => new URL(r.url).host === "api.github.com")).toBe(true);
  });

  it("explains how to get access when a repo can't be read", async () => {
    const gh = fakeGitHub({ "acme/secret": { private: true, refs: { main: "s1" }, commits: { s1: {} } } });
    await expect(withRemote([parseSpec("acme/secret/vault")], gh.github(""))).rejects.toThrow(/GH_TOKEN or run `gh auth login`/);
  });

  it("uses the repo's own sibling items and falls back to built-in ones", async () => {
    const card = item("card", "1.0.0", { "card/card.tsx": CARD_V1 }, { registryDependencies: ["badge", "button", "utils"] });
    const badge = item("badge", "1.0.0", { "badge/badge.tsx": "export const Badge = 1;\n" });
    const gh = fakeGitHub({ "acme/ui": { refs: { main: "sha1" }, commits: { sha1: registryFiles([card, badge]) } } });
    await withRemote([parseSpec("acme/ui/card")], gh.github());
    add(ctx, ["acme/ui/card"]);

    expect(Object.keys(lock().items)).toEqual(expect.arrayContaining(["acme/ui/badge", "acme/ui/card", "button", "utils"]));
    expect(read("button/button.tsx")).toBe("export const Button = 'builtin';\n"); // built-in, not in the repo
    expect(lock().items.button.source).toBeUndefined();
  });

  it("works without a manifest, from registry/ by default", async () => {
    const gh = fakeGitHub({ "acme/ui": { refs: { main: "sha1" }, commits: { sha1: registryFiles([item("card", "1.0.0", { "card/card.tsx": CARD_V1 })], "registry", false) } } });
    await withRemote([parseSpec("acme/ui/card")], gh.github());
    add(ctx, ["acme/ui/card"]);
    expect(read("card/card.tsx")).toBe(CARD_V1);
  });

  it("resolves namespaces from rdloom.json and a pinned tag", async () => {
    const gh = fakeGitHub({
      "acme/ui": { refs: { main: "sha2", v1: "sha1" }, commits: { sha1: registryFiles([item("card", "1.0.0", { "card/card.tsx": CARD_V1 })]), sha2: {} } },
    });
    setRegistries({ "@acme": "acme/ui#v1" });
    await withRemote([parseSpec("@acme/card", { "@acme": "acme/ui#v1" })], gh.github());
    add(ctx, ["@acme/card"]);
    expect(lock().items["@acme/card"]).toMatchObject({ source: "github:acme/ui#v1", sha: "sha1" });
  });

  it("says which file it looked for when the item doesn't exist", async () => {
    const gh = fakeGitHub({ "acme/ui": { refs: { main: "sha1" }, commits: { sha1: registryFiles([], "components/registry") } } });
    await expect(withRemote([parseSpec("acme/ui/nope")], gh.github())).rejects.toThrow(/looked for components\/registry\/nope\.json/);
  });
});

describe("rdloom upgrade from GitHub", () => {
  it("fetches the branch's new commit and merges it into local edits", async () => {
    const v2 = CARD_V1.replace("card v1", "card v2");
    const repo: FakeRepo = { refs: { main: "sha1" }, commits: { sha1: registryFiles([item("card", "1.0.0", { "card/card.tsx": CARD_V1 })]) } };
    const gh = fakeGitHub({ "acme/ui": repo });
    await withRemote([parseSpec("acme/ui/card")], gh.github());
    add(ctx, ["acme/ui/card"]);

    // You change one line; upstream pushes a new commit changing another.
    const file = path.join(cwd, "src/components/rdloom/card/card.tsx");
    fs.writeFileSync(file, read("card/card.tsx").replace("pad = 4", "pad = 8"));
    repo.commits.sha2 = registryFiles([item("card", "1.1.0", { "card/card.tsx": v2 })]);
    repo.refs.main = "sha2";

    // index.ts re-fetches installed GitHub items from their recorded source.
    const spec: RemoteSpec = { key: "acme/ui/card", prefix: "acme/ui/", item: "card", source: { owner: "acme", repo: "ui" } };
    await withRemote([spec], gh.github());
    expect(diff(ctx, ["acme/ui/card"])[0].files[0].status).toBe("merge");
    upgrade(ctx, ["acme/ui/card"]);

    expect(read("card/card.tsx")).toBe(v2.replace("pad = 4", "pad = 8"));
    expect(lock().items["acme/ui/card"]).toMatchObject({ version: "1.1.0", sha: "sha2" });
  });
});

describe("rdloom registry build / validate", () => {
  const writeRepo = (manifest: object, files: Record<string, string>) => {
    const repo = path.join(root, "repo");
    fs.mkdirSync(repo, { recursive: true });
    for (const [p, c] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(repo, p)), { recursive: true });
      fs.writeFileSync(path.join(repo, p), c);
    }
    fs.writeFileSync(path.join(repo, "rdloom-registry.json"), JSON.stringify(manifest));
    return repo;
  };

  it("builds items with inline file contents and an index", () => {
    const repo = writeRepo(
      {
        name: "acme",
        output: "public/r",
        items: [{ name: "card", version: "1.0.0", description: "A card", registryDependencies: ["button"], files: [{ path: "card/card.tsx", source: "src/card.tsx" }] }],
      },
      { "src/card.tsx": "export const Card = 1;\r\n" },
    );
    buildRegistry(repo, undefined, ctx.out, registryDir);
    const built = JSON.parse(fs.readFileSync(path.join(repo, "public/r/card.json"), "utf8"));
    expect(built).toMatchObject({ name: "card", type: "registry:ui", registryDependencies: ["button"] });
    expect(built.files[0]).toEqual({ path: "card/card.tsx", type: "registry:ui", content: "export const Card = 1;\n" });
    expect(JSON.parse(fs.readFileSync(path.join(repo, "public/r/index.json"), "utf8")).items).toHaveLength(1);
  });

  it("reports every problem at once", () => {
    const repo = writeRepo(
      {
        name: "Acme!",
        output: "../outside",
        items: [
          { name: "card", version: "1", description: "", dependencies: ["not a package"], registryDependencies: ["nowhere"], files: [{ path: "../escape.tsx" }, { path: "missing.tsx" }] },
          { name: "card", version: "1.0.0", description: "dup", files: [] },
        ],
      },
      {},
    );
    expect(validateRegistry(repo, undefined, ctx.out, registryDir)).toBe(false);
    const text = logs.join("\n");
    for (const expected of ["name:", "output:", "version", "description", "isn't an npm package", "../escape.tsx", "doesn't exist", "duplicate name", "at least one file", '"nowhere"']) {
      expect(text).toContain(expected);
    }
    expect(() => buildRegistry(repo, undefined, ctx.out, registryDir)).toThrow(/fix these first/);
  });
});
