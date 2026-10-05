// Screenshots docs pages at desktop size, at the top and further down.
//   node scripts/page-shot.mjs <outDir> <light|dark> <path> [path...]
// Needs the docs dev server on :5190.
import fs from "node:fs";
import { chromium } from "@playwright/test";

const [out, scheme, ...paths] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: scheme });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
for (const p of paths) {
  await page.goto(`http://localhost:5190${p}`);
  await page.waitForSelector("h1");
  await page.waitForTimeout(800);
  const slug = p.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home";
  await page.screenshot({ path: `${out}/${slug}-${scheme}-1.png` });
  for (const [i, y] of [900, 1800].entries()) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/${slug}-${scheme}-${i + 2}.png` });
  }
}
console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console errors");
await browser.close();
