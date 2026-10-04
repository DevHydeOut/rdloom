import { spawnSync } from "node:child_process";
import { CliError, type RegistryItem } from "./project.ts";

// GitHub registries: `rdloom add owner/repo/item` (or `@ns/item` through the
// `registries` map in rdloom.json) installs items that another repository
// publishes in the rdloom registry format.
//
// A repository is a registry when it has rdloom-registry.json at its root
// (its `output` names the folder of built items, default "registry"), or,
// without one, a registry/ folder of built items (`rdloom registry build`).
//
// Public repos are read anonymously. When a repo isn't publicly readable, the
// CLI uses GH_TOKEN / GITHUB_TOKEN, or the GitHub CLI's stored login
// (`gh auth token`). Tokens are only ever sent to api.github.com, and each
// install is pinned to a commit SHA so upgrades know exactly what changed.

export interface RemoteSource {
  owner: string;
  repo: string;
  /** Branch, tag or SHA asked for; undefined means the default branch. */
  ref?: string;
}

export interface RemoteSpec {
  /** Name used in the lock file and by `rdloom diff/upgrade`: "owner/repo/item" or "@ns/item". */
  key: string;
  /** "owner/repo/" or "@ns/": what qualifies sibling items of the same registry. */
  prefix: string;
  item: string;
  source: RemoteSource;
}

/** Lock-file form of a source: "github:owner/repo#ref". */
export const sourceId = (s: RemoteSource) => `github:${s.owner}/${s.repo}${s.ref ? `#${s.ref}` : ""}`;

export function parseSourceId(id: string): RemoteSource {
  const m = id.match(/^github:([\w.-]+)\/([\w.-]+)(?:#(.+))?$/);
  if (!m) throw new CliError(`bad registry source "${id}"`);
  return { owner: m[1], repo: m[2], ref: m[3] };
}

/** "owner/repo" or "owner/repo#ref", as written in rdloom.json `registries`. */
function parseRepo(value: string, where: string): RemoteSource {
  const m = value.replace(/^github:/, "").match(/^([\w.-]+)\/([\w.-]+)(?:#(.+))?$/);
  if (!m) throw new CliError(`${where}: "${value}" should look like "owner/repo" or "owner/repo#branch"`);
  return { owner: m[1], repo: m[2], ref: m[3] };
}

/**
 * Parses what the user typed. Plain names ("button") are the built-in
 * registry and return null.
 *   owner/repo/item[#ref]    a GitHub repository
 *   @ns/item                 a namespace from rdloom.json `registries`
 */
export function parseSpec(name: string, registries: Record<string, string> = {}): RemoteSpec | null {
  if (name.startsWith("@")) {
    const m = name.match(/^(@[\w.-]+)\/([\w.-]+)$/);
    if (!m) throw new CliError(`"${name}" should look like "@namespace/item"`);
    const repo = registries[m[1]];
    if (!repo) {
      const known = Object.keys(registries);
      throw new CliError(
        `unknown registry "${m[1]}". Add it to rdloom.json, e.g. "registries": { "${m[1]}": "owner/repo" }` +
          (known.length ? `. Configured: ${known.join(", ")}` : ""),
      );
    }
    return { key: name, prefix: `${m[1]}/`, item: m[2], source: parseRepo(repo, `registries["${m[1]}"]`) };
  }
  const m = name.match(/^([\w.-]+)\/([\w.-]+)\/([\w.-]+)(?:#(.+))?$/);
  if (m) {
    const [, owner, repo, item, ref] = m;
    return { key: `${owner}/${repo}/${item}`, prefix: `${owner}/${repo}/`, item, source: { owner, repo, ref } };
  }
  if (name.includes("/")) throw new CliError(`"${name}" should be a component name, "owner/repo/item" or "@namespace/item"`);
  return null;
}

// --- GitHub access -------------------------------------------------------------

export type Fetch = (url: string, init: { headers: Record<string, string> }) => Promise<{ status: number; text(): Promise<string>; headers: { get(name: string): string | null } }>;

export interface GitHubOptions {
  fetch?: Fetch;
  /** Returns a token for private repos, or undefined. Injectable for tests. */
  token?: () => string | undefined;
}

/** GH_TOKEN, GITHUB_TOKEN, then the GitHub CLI's stored login. */
export function defaultToken(): string | undefined {
  const env = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (env) return env;
  const candidates = process.platform === "win32" ? ["gh", "C:\\Program Files\\GitHub CLI\\gh.exe"] : ["gh"];
  for (const cmd of candidates) {
    const r = spawnSync(cmd, ["auth", "token"], { encoding: "utf8", timeout: 10_000 });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  return undefined;
}

const API = "https://api.github.com";

export class GitHub {
  private readonly fetch: Fetch;
  private readonly getToken: () => string | undefined;
  private token: string | undefined | null = null; // null: not looked up yet
  /** Repos that needed the token, so later requests skip the anonymous try. */
  private readonly private = new Set<string>();
  private readonly shas = new Map<string, string>();

  constructor(opts: GitHubOptions = {}) {
    this.fetch = opts.fetch ?? (globalThis.fetch as unknown as Fetch);
    this.getToken = opts.token ?? defaultToken;
  }

  private async request(repoKey: string, apiPath: string, accept: string): Promise<{ status: number; body: string }> {
    const url = `${API}${apiPath}`;
    const headers: Record<string, string> = { Accept: accept, "User-Agent": "rdloom-cli", "X-GitHub-Api-Version": "2022-11-28" };
    const send = async (withToken: boolean) => {
      const h = { ...headers };
      if (withToken) h.Authorization = `Bearer ${this.token}`;
      const res = await this.fetch(url, { headers: h });
      if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
        throw new CliError(
          withToken
            ? "GitHub API rate limit reached. Try again later."
            : "GitHub's anonymous rate limit (60 requests an hour) is used up. Set GH_TOKEN or log in with `gh auth login`.",
        );
      }
      return { status: res.status, body: await res.text() };
    };

    if (!this.private.has(repoKey)) {
      const anon = await send(false);
      if (anon.status !== 404 && anon.status !== 401 && anon.status !== 403) return anon;
    }
    if (this.token === null) this.token = this.getToken();
    if (!this.token) return { status: 404, body: "" };
    const authed = await send(true);
    if (authed.status < 400) this.private.add(repoKey);
    return authed;
  }

  /** The commit a ref points to; installs are pinned to it. */
  async resolveSha(source: RemoteSource): Promise<string> {
    const repoKey = `${source.owner}/${source.repo}`;
    const cacheKey = `${repoKey}#${source.ref ?? ""}`;
    const cached = this.shas.get(cacheKey);
    if (cached) return cached;
    const res = await this.request(repoKey, `/repos/${repoKey}/commits/${encodeURIComponent(source.ref ?? "HEAD")}`, "application/vnd.github.sha");
    if (res.status === 404 || res.status === 422) {
      throw new CliError(
        `can't read ${repoKey}${source.ref ? ` at "${source.ref}"` : ""} on GitHub. Check the name, or if it's private, set GH_TOKEN or run \`gh auth login\`.`,
      );
    }
    if (res.status >= 400) throw new CliError(`GitHub returned ${res.status} for ${repoKey}`);
    const sha = res.body.trim();
    this.shas.set(cacheKey, sha);
    return sha;
  }

  /** A file's text at a commit, or undefined if it doesn't exist. */
  async file(source: RemoteSource, sha: string, filePath: string): Promise<string | undefined> {
    const repoKey = `${source.owner}/${source.repo}`;
    const res = await this.request(repoKey, `/repos/${repoKey}/contents/${filePath.split("/").map(encodeURIComponent).join("/")}?ref=${sha}`, "application/vnd.github.raw");
    if (res.status === 404) return undefined;
    if (res.status >= 400) throw new CliError(`GitHub returned ${res.status} for ${repoKey}/${filePath}`);
    return res.body;
  }
}

// --- Loading items ---------------------------------------------------------------

export interface LoadedRemote {
  /** Items by qualified name, with registryDependencies qualified too. */
  items: Map<string, RegistryItem>;
  /** Lock source per qualified name, e.g. "github:acme/ui#main". */
  sources: Map<string, { id: string; sha: string }>;
}

interface RepoRegistry {
  sha: string;
  output: string;
}

/**
 * Fetches the named remote items and, recursively, their dependencies from
 * the same registry. A bare dependency ("button") means the registry's own
 * item when it has one, and the built-in rdloom item otherwise.
 */
export async function loadRemote(
  specs: RemoteSpec[],
  registries: Record<string, string> = {},
  github: GitHub = new GitHub(),
): Promise<LoadedRemote> {
  const loaded: LoadedRemote = { items: new Map(), sources: new Map() };
  const repos = new Map<string, Promise<RepoRegistry>>();

  const repoRegistry = (source: RemoteSource) => {
    const id = sourceId(source);
    if (!repos.has(id)) {
      repos.set(
        id,
        (async () => {
          const sha = await github.resolveSha(source);
          const manifest = await github.file(source, sha, "rdloom-registry.json");
          let output = "registry";
          if (manifest) {
            try {
              output = (JSON.parse(manifest) as { output?: string }).output ?? output;
            } catch {
              throw new CliError(`${source.owner}/${source.repo}: rdloom-registry.json is not valid JSON`);
            }
          }
          return { sha, output: output.replace(/^\.?\/+|\/+$/g, "") };
        })(),
      );
    }
    return repos.get(id)!;
  };

  const fetchItem = async (spec: RemoteSpec): Promise<RegistryItem | undefined> => {
    const { sha, output } = await repoRegistry(spec.source);
    const text = await github.file(spec.source, sha, `${output}/${spec.item}.json`);
    if (text === undefined) return undefined;
    try {
      return JSON.parse(text) as RegistryItem;
    } catch {
      throw new CliError(`${spec.key}: ${output}/${spec.item}.json is not valid JSON`);
    }
  };

  const visit = async (spec: RemoteSpec, requested: boolean): Promise<boolean> => {
    if (loaded.items.has(spec.key)) return true;
    const item = await fetchItem(spec);
    if (!item) {
      if (!requested) return false; // a bare dependency the registry doesn't have: built-in
      const { output } = await repoRegistry(spec.source);
      throw new CliError(`"${spec.item}" isn't in ${spec.source.owner}/${spec.source.repo} (looked for ${output}/${spec.item}.json)`);
    }
    // Reserve the key before recursing, so dependency cycles terminate.
    loaded.items.set(spec.key, { ...item, name: spec.key });
    const { sha } = await repoRegistry(spec.source);
    loaded.sources.set(spec.key, { id: sourceId(spec.source), sha });

    const deps: string[] = [];
    for (const dep of item.registryDependencies ?? []) {
      const other = parseSpec(dep, registries);
      if (other) {
        await visit(other, true); // qualified: an item from another registry
        deps.push(other.key);
        continue;
      }
      const sibling: RemoteSpec = { key: spec.prefix + dep, prefix: spec.prefix, item: dep, source: spec.source };
      deps.push((await visit(sibling, false)) ? sibling.key : dep);
    }
    loaded.items.get(spec.key)!.registryDependencies = deps;
    return true;
  };

  for (const spec of specs) await visit(spec, true);
  return loaded;
}
