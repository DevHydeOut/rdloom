// Opens the command palette example in light and dark and captures it, empty and filtered.
//   node scripts/shot-palette.mjs <outDir>
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const scheme of ["light", "dark"]) {
  const context = await browser.newContext({ viewport: { width: 1000, height: 640 }, colorScheme: scheme });
  const page = await context.newPage();
  await page.goto("http://localhost:5190/components/command-palette");
  await page.waitForSelector("h1");
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.getByRole("button", { name: "Open commands" }).click();
  await page.waitForSelector('[role="dialog"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, `palette-open-${scheme}.png`) });
  await page.keyboard.type("set");
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, `palette-filtered-${scheme}.png`) });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type("zzz");
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, `palette-empty-${scheme}.png`) });
  await context.close();
}
await browser.close();
console.log("done");
