import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// React Server Components: anything reaching react-aria-components or a hook
// must say "use client", or a Next.js App Router build fails with
// "'client-only' cannot be imported from a Server Component module".
// Users copy these files, so the directive has to be in the source.

// jsdom leaves import.meta.url as a non-file URL, so find the package by
// walking up from the working directory instead.
function packageRoot(): string {
  for (let dir = process.cwd(); ; dir = path.dirname(dir)) {
    for (const candidate of [dir, path.join(dir, "packages", "react")]) {
      if (fs.existsSync(path.join(candidate, "src", "button", "button.tsx"))) return candidate;
    }
    if (dir === path.dirname(dir)) throw new Error("packages/react not found above " + process.cwd());
  }
}

const reactPkg = packageRoot();
const src = path.join(reactPkg, "src");

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "generated" ? [] : sources(full);
    return /\.tsx?$/.test(e.name) ? [full] : [];
  });
}

const needsClient = (code: string) =>
  /from "react-aria-components"/.test(code) || /\buse[A-Z]\w*\(/.test(code) || /from "react-stately"/.test(code);

describe("client components", () => {
  const files = sources(src).map((file) => ({ rel: path.relative(src, file).replace(/\\/g, "/"), code: fs.readFileSync(file, "utf8") }));

  it("finds the component sources", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('starts every hook or react-aria file with "use client"', () => {
    const missing = files.filter((f) => needsClient(f.code) && !/^\s*"use client";/.test(f.code)).map((f) => f.rel);
    expect(missing).toEqual([]);
  });

  it("keeps the directive first, where a bundler will see it", () => {
    for (const f of files.filter((f) => f.code.includes('"use client"'))) {
      expect(f.code.startsWith('"use client";'), `${f.rel} must open with the directive`).toBe(true);
    }
  });

  it("ships the directive in the registry users install from", () => {
    const registry = path.join(reactPkg, "..", "cli", "registry", "button.json");
    const item = JSON.parse(fs.readFileSync(registry, "utf8")) as { files: { path: string; content: string }[] };
    const button = item.files.find((f) => f.path.endsWith("button/button.tsx"))!;
    expect(button.content.startsWith('"use client";')).toBe(true);
  });
});
