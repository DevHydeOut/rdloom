import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// A crawl of the built docs site that looks for the faults a visitor, a search engine or a screen reader would hit:
// scripts that throw, requests that fail, links and #anchors that go nowhere, headings out of order, repeated ids,
// leftover text (placeholders, broken characters, em dashes, other libraries' names) and accessibility problems on
// the pages themselves. It reads the page list from the sitemap, so a new page is covered without editing this file.

const dist = process.env.PW_DIST ? path.resolve(process.env.PW_DIST) : path.resolve(__dirname, "../../apps/docs/dist");
const sitemap = readFileSync(path.join(dist, "sitemap.xml"), "utf8");
const pages = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);

// Text that must not reach a visitor.
const banned: Array<[RegExp, string]> = [
  [/\bundefined\b|\bNaN\b|\[object Object\]/, "a value that was never filled in (undefined, NaN or [object Object])"],
  [/lorem ipsum|\bTODO\b|\bFIXME\b/i, "placeholder text"],
  [/<your-docs-url>/, "the stand-in docs address"],
  [/Ã.|â€|Â·|Â /, "broken characters (a file read with the wrong encoding)"],
  [/—/, "an em dash (the docs avoid them)"],
  [/\b(shadcn|MUI|Material UI|Ant Design|Chakra|Radix UI|Mantine)\b/i, "another library's name"],
];
// Where a banned word is allowed (none today: the registry command sits in a code block, which this check skips).
const allowedBanned = new Set<string>();

async function collect(page: Page) {
  return page.evaluate(() => {
    const own = (el: Element) => !el.closest("[data-docs-preview]");
    // The reading text of the page: not code samples, and not the demo screens in the previews.
    const copy = document.querySelector("main")!.cloneNode(true) as HTMLElement;
    copy.querySelectorAll("pre, code, [data-docs-preview], script, style").forEach((n) => n.remove());
    document.body.append(copy);
    copy.style.cssText = "position:absolute;left:-9999px;width:800px";
    const text = copy.innerText;
    copy.remove();
    const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
    const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
    // Skipped heading levels on the page itself (a demo screen in a preview has its own structure).
    const heads = [...document.querySelectorAll("main h1, main h2, main h3, main h4, main h5, main h6")].filter(own).map((h) => Number(h.tagName[1]));
    const skips: string[] = [];
    heads.forEach((level, i) => {
      if (i > 0 && level > heads[i - 1] + 1) skips.push(`h${heads[i - 1]} then h${level}`);
    });
    const anchors = [...document.querySelectorAll<HTMLAnchorElement>("a[href]")].filter(own);
    const hashes = anchors.map((a) => a.getAttribute("href")!).filter((h) => h.startsWith("#") && h.length > 1);
    const missingHash = hashes.filter((h) => !document.getElementById(decodeURIComponent(h.slice(1))));
    const external = anchors.filter((a) => /^https?:/.test(a.getAttribute("href")!));
    const unsafeBlank = external.filter((a) => a.target === "_blank" && !/noopener/.test(a.rel)).map((a) => a.href);
    const noName = anchors.filter((a) => !(a.textContent || a.getAttribute("aria-label") || a.querySelector("img[alt]:not([alt=''])")?.getAttribute("alt") || "").trim()).map((a) => a.outerHTML.slice(0, 80));
    const noAlt = [...document.querySelectorAll("img:not([alt])")].filter(own).map((i) => (i as HTMLImageElement).src);
    const h1 = [...document.querySelectorAll("h1")].filter(own).length;
    return { text, dupIds, skips, missingHash, unsafeBlank, noName, noAlt, h1, lang: document.documentElement.lang, title: document.title };
  });
}

test.describe.configure({ mode: "parallel" });

for (const route of pages) {
  test(`${route} has no script errors, dead links or leftover text`, async ({ page }) => {
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(`script error: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") problems.push(`console ${m.type()}: ${m.text().slice(0, 200)}`);
    });
    page.on("response", (r) => {
      if (r.status() >= 400) problems.push(`request ${r.status()}: ${r.url()}`);
    });

    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    // A demo shell inside a preview drops its own main landmark once the page has hydrated: give a busy machine time for that.
    await page.waitForFunction(() => document.querySelectorAll("main, [role=main]").length === 1, null, { timeout: 8000 }).catch(() => undefined);
    const info = await collect(page);

    if (info.lang !== "en") problems.push(`html lang is "${info.lang}"`);
    if (info.h1 !== 1) problems.push(`${info.h1} h1 headings`);
    if (info.dupIds.length) problems.push(`repeated ids: ${[...new Set(info.dupIds)].slice(0, 5).join(", ")}`);
    if (info.skips.length) problems.push(`heading levels skipped: ${[...new Set(info.skips)].slice(0, 3).join("; ")}`);
    if (info.missingHash.length) problems.push(`links to #anchors that do not exist: ${info.missingHash.slice(0, 5).join(", ")}`);
    if (info.unsafeBlank.length) problems.push(`target=_blank without rel=noopener: ${info.unsafeBlank.slice(0, 3).join(", ")}`);
    if (info.noName.length) problems.push(`links with no name: ${info.noName.slice(0, 3).join(" | ")}`);
    if (info.noAlt.length) problems.push(`images with no alt: ${info.noAlt.slice(0, 3).join(", ")}`);

    if (!allowedBanned.has(route)) {
      for (const [re, what] of banned) {
        const hit = info.text.match(re);
        if (hit) problems.push(`${what}: "${info.text.slice(Math.max(0, (hit.index ?? 0) - 25), (hit.index ?? 0) + 35).replace(/\s+/g, " ")}"`);
      }
    }

    // The page's own accessibility (previews hold demo screens that other tests check).
    await page.addScriptTag({ path: path.resolve(__dirname, "../../node_modules/axe-core/axe.min.js") });
    const axe = await page.evaluate(async () => {
      // @ts-expect-error axe is added to the page above
      type AxeNode = { target: unknown[]; element?: Element };
      const r = await window.axe.run(document.body, { exclude: [["[data-docs-preview]"]], resultTypes: ["violations"], elementRef: true });
      // Rules that compare elements across the page (heading order, repeated landmark names) still report a demo's own elements
      // although the preview is excluded: drop those, and the visually hidden helper text that React Aria appends to the body.
      const mine = (n: AxeNode) => {
        const el = n.element;
        if (!el) return true;
        if (el.closest("[data-docs-preview]")) return false;
        return !(el.parentElement === document.body && /clip-path: inset\(50%\)/.test(el.getAttribute("style") ?? ""));
      };
      return r.violations
        .map((v: { id: string; nodes: AxeNode[] }) => ({ id: v.id, nodes: v.nodes.filter(mine) }))
        .filter((v: { nodes: AxeNode[] }) => v.nodes.length)
        .map((v: { id: string; nodes: AxeNode[] }) => `${v.id} (${v.nodes.length}): ${String(v.nodes[0]?.target).slice(0, 80)}`);
    });
    problems.push(...axe.map((a: string) => `axe ${a}`));

    expect(problems, `${route}\n  ${problems.join("\n  ")}`).toEqual([]);
  });
}

test("the 404 page is served for an unknown address", async ({ page }) => {
  const res = await page.goto("/this-page-does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: /not found/i })).toBeVisible();
});

test("every registry file is valid JSON that names its files", async ({ request }) => {
  const index = await (await request.get("/r/registry.json")).json();
  const items: Array<{ name: string }> = index.items ?? [];
  expect(items.length).toBeGreaterThan(50);
  const bad: string[] = [];
  for (const item of items) {
    const res = await request.get(`/r/${item.name}.json`);
    if (res.status() !== 200) {
      bad.push(`${item.name}: ${res.status()}`);
      continue;
    }
    const json = await res.json();
    // The tokens item carries its variables as cssVars rather than as a file.
    if (json.cssVars && Object.keys(json.cssVars).length) continue;
    if (!Array.isArray(json.files) || json.files.length === 0) bad.push(`${item.name}: no files`);
    else if (json.files.some((f: { content?: string }) => !f.content)) bad.push(`${item.name}: a file has no content`);
  }
  expect(bad).toEqual([]);
});
