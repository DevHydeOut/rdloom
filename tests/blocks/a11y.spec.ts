import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

// An axe scan of every example of every block, light and dark. Reports every violation with the example it is in,
// so a failure names the block, the example and the element.
const specsDir = path.resolve(__dirname, "../../specs");
const axeSource = fs.readFileSync(path.resolve(__dirname, "../../node_modules/axe-core/axe.min.js"), "utf8");
const slug = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const blocks = fs
  .readdirSync(specsDir)
  .filter((f) => f.endsWith(".spec.json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(specsDir, f), "utf8")))
  .filter((s) => s.category === "block")
  .map((s) => ({ id: slug(s.name), examples: (s.examples ?? []) as string[] }));

// Rules that depend on the lab's own page, not on the block: the page has one h1 and the examples are scanned one by one.
const pageRules = ["region", "landmark-one-main", "page-has-heading-one", "landmark-unique", "heading-order", "landmark-no-duplicate-banner", "landmark-no-duplicate-contentinfo", "landmark-banner-is-top-level", "landmark-contentinfo-is-top-level", "landmark-complementary-is-top-level", "landmark-main-is-top-level", "scrollable-region-focusable"];

for (const block of blocks) {
  for (const theme of ["light", "dark"]) {
    test(`${block.id} · axe · ${theme}`, async ({ page }) => {
      await page.goto(`/#${block.id}`);
      await page.getByRole("toolbar", { name: "Test controls" }).getByLabel("Theme").selectOption(theme);
      await expect(page.locator("[data-result]")).toHaveCount(block.examples.length, { timeout: 20_000 });
      await page.addScriptTag({ content: axeSource });
      const found = await page.evaluate(async (skip) => {
        let passes = 0;
        const out: Array<{ example: string; rule: string; impact: string | null | undefined; target: string; summary: string }> = [];
        for (const section of Array.from(document.querySelectorAll("main section"))) {
          const example = section.querySelector("h2")?.textContent ?? "?";
          const frame = section.lastElementChild as HTMLElement;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (window as any).axe.run(frame, { rules: Object.fromEntries(skip.map((r) => [r, { enabled: false }])) });
          passes += result.passes.length;
          for (const v of result.violations) for (const n of v.nodes) out.push({ example, rule: v.id, impact: v.impact, target: n.target.join(" ").slice(0, 140), summary: (n.failureSummary ?? "").split("\n")[1]?.trim() ?? "" });
        }
        return { out, passes };
      }, pageRules);
      // The scan must have actually checked something in every example.
      expect(found.passes, "axe ran no rules").toBeGreaterThan(block.examples.length * 3);
      expect(found.out, JSON.stringify(found.out, null, 1)).toEqual([]);
    });
  }
}
