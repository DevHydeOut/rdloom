import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

// Every example, on a phone (390 px) and a tablet (768 px): the page must never scroll sideways.
// An example may scroll inside its own box (a table, a data grid); the page around it may not.
// Examples that are meant to be wider than a phone are listed in `allowed` with the reason.

const examplesDir = path.resolve(__dirname, "../../examples/components");
const examples = fs
  .readdirSync(examplesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) =>
    fs
      .readdirSync(examplesDir + "/" + d.name)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => ({ id: d.name, name: f.slice(0, -4) })),
  );

const allowed = new Set<string>([
  // none yet: add "component/example" with a reason if one is wider on purpose
]);

const sizes = [
  { label: "phone", width: 390, height: 844 },
  { label: "tablet", width: 768, height: 1024 },
];

for (const size of sizes) {
  test.describe(size.label, () => {
    test.use({ viewport: { width: size.width, height: size.height } });
    for (const { id, name } of examples) {
      test(`${id}/${name} does not scroll sideways`, async ({ page }) => {
        test.skip(allowed.has(`${id}/${name}`), "wider on purpose");
        await page.goto(`/visual/${id}/${name}?fit=1`);
        await page.locator("[data-visual-ready]").waitFor({ state: "attached" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(150);
        const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
        expect(widths.scroll, `the page is ${widths.scroll}px wide in a ${widths.client}px window`).toBeLessThanOrEqual(widths.client);
      });
    }
  });
}
