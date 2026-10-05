// Captures each example of the given components, in light and dark, to a folder.
//   node scripts/shots.mjs <outDir> <component> [component...]
// Needs the docs dev server on :5190 (npm run dev -w @rdloom/docs).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const [out, ...components] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();

for (const scheme of ["light", "dark"]) {
  const context = await browser.newContext({ viewport: { width: 1100, height: 900 }, colorScheme: scheme, deviceScaleFactor: 1 });
  const page = await context.newPage();
  for (const name of components) {
    await page.goto(`http://localhost:5190/components/${name}`);
    await page.waitForSelector("h1");
    // Examples load as they scroll into view: walk down the page so each one mounts.
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 500) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(600);
    const previews = await page.$$('[role="tabpanel"]');
    let i = 0;
    for (const panel of previews) {
      if (!(await panel.isVisible())) continue;
      const box = await panel.boundingBox();
      if (!box || box.height < 20) continue;
      await panel.screenshot({ path: path.join(out, `${name}-${i++}-${scheme}.png`) });
    }
  }
  await context.close();
}
await browser.close();
console.log("done");
