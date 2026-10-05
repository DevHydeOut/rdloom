// Checks the motion components in Chromium: do they animate, do they stop for reduced
// motion and for isPaused, does a ripple appear on a press, and does BlurFade reveal.
//   node scripts/check-motion.mjs [outDir]   (needs the docs dev server on :5190)
import fs from "node:fs";
import { chromium } from "@playwright/test";

const out = process.argv[2];
if (out) fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();

const open = async (context, path) => {
  const page = await context.newPage();
  await page.goto(`http://localhost:5190${path}`);
  await page.waitForSelector("h1");
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  return page;
};
const running = (page) =>
  page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getTiming().iterations === Infinity).length);

const names = ["shimmer-button", "pulse-button", "gradient-button", "shuttle-border", "shine-border", "text-shimmer", "gradient-text", "ripple"];
const result = {};

// 1. Each effect animates in a normal context, and none do when the visitor prefers reduced motion.
for (const [label, opts] of [["normal", {}], ["reduced", { reducedMotion: "reduce" }]]) {
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 }, ...opts });
  for (const name of names) {
    const page = await open(context, `/components/${name}`);
    result[`${name} (${label})`] = await running(page);
    if (out && label === "normal") {
      const preview = page.locator("main .overflow-hidden.rounded-xl").first();
      await preview.screenshot({ path: `${out}/${name}.png` });
    }
    await page.close();
  }
  await context.close();
}

// 2. The Still toggle stops an effect without changing the system setting.
{
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await open(context, "/components/shimmer-button");
  const before = await running(page);
  await page.getByRole("button", { name: "Still" }).first().click();
  await page.waitForTimeout(300);
  result["shimmer-button: running before / after Still"] = `${before} / ${await running(page)}`;
  await page.close();

  // 3. isPaused freezes the example, and resuming starts it again.
  const paused = await open(context, "/components/shimmer-button");
  await paused.getByRole("button", { name: "Pause motion" }).click();
  await paused.waitForTimeout(300);
  const pausedState = await paused.evaluate(() => document.querySelector("[data-rdm-paused] .rdm-shimmer") !== null || document.querySelector("[data-rdm-paused]") !== null);
  result["shimmer-button: data-rdm-paused present after Pause motion"] = pausedState;
  await paused.close();

  // 4. A press makes a ripple, and it removes itself.
  const ripple = await open(context, "/components/ripple-button");
  const button = ripple.getByRole("button", { name: "Press me" }).first();
  await button.click();
  result["ripple-button: ripples right after a press"] = await ripple.locator(".rdm-ripple").count();
  await ripple.waitForTimeout(900);
  result["ripple-button: ripples after it finishes"] = await ripple.locator(".rdm-ripple").count();
  await ripple.keyboard.press("Tab");
  await button.focus();
  await ripple.keyboard.press("Enter");
  result["ripple-button: ripple from a key press"] = await ripple.locator(".rdm-ripple").count();
  await ripple.close();

  // 5. BlurFade is visible to start, then reveals.
  const fade = await open(context, "/components/blur-fade");
  result["blur-fade: phases on the page"] = await fade.evaluate(() => [...new Set([...document.querySelectorAll("[data-blur-fade]")].map((e) => e.getAttribute("data-blur-fade")))].join(","));
  await context.close();
}

console.log(JSON.stringify(result, null, 2));
await browser.close();
