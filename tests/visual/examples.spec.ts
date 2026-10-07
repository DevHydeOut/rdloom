import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// One screenshot per spec example and theme, taken from the docs site's
// /visual/<component>/<example> page. Update baselines with
// `npm run test:visual:update` (see README: Visual regression tests).

const examplesDir = path.resolve(__dirname, "../../examples/components");
const examples = fs
  .readdirSync(examplesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) =>
    fs
      .readdirSync(path.join(examplesDir, d.name))
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => ({ id: d.name, name: f.slice(0, -4) })),
  );

// A fixed "today", so calendars and date presets look the same every day.
const NOW = new Date("2026-03-15T10:00:00Z");

async function open(page: Page, id: string, name: string, theme: string) {
  await page.clock.setFixedTime(NOW);
  await page.goto(`/visual/${id}/${name}?theme=${theme}`);
  await page.locator("[data-visual-ready]").waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready);
  // An image that fails (the avatar fallback example) swaps to its initials once the browser reports the failure.
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  // Examples that fetch (combobox/async) show a spinner first; wait it out.
  await expect(page.getByRole("status", { name: "Loading" })).toHaveCount(0);
}

for (const theme of ["light", "dark"]) {
  test.describe(theme, () => {
    for (const { id, name } of examples) {
      test(`${id}/${name}`, async ({ page }) => {
        await open(page, id, name, theme);
        await expect(page.locator("[data-visual]")).toHaveScreenshot(`${id}--${name}--${theme}.png`);
      });
    }

    // Open states of the hard components, where most visual bugs hide.
    const opened: Array<{ id: string; name: string; open: (page: Page) => Promise<void> }> = [
      { id: "select", name: "basic", open: (p) => p.getByRole("button", { name: /Country/ }).click() },
      { id: "date-range-picker", name: "with-presets", open: (p) => p.getByRole("button", { name: "Calendar" }).click() },
      {
        id: "combobox",
        name: "basic",
        open: async (p) => {
          await p.getByRole("combobox", { name: "Country" }).click();
          await p.keyboard.press("ArrowDown");
        },
      },
      { id: "dialog", name: "alert", open: (p) => p.getByRole("button", { name: "Delete project" }).click() },
      { id: "menu", name: "sections", open: (p) => p.getByRole("button", { name: "Project" }).click() },
      { id: "sheet", name: "filters", open: (p) => p.getByRole("button", { name: "Filters" }).click() },
    ];
    for (const o of opened) {
      test(`${o.id}/${o.name} open`, async ({ page }) => {
        await open(page, o.id, o.name, theme);
        await o.open(page);
        await page.waitForTimeout(300); // let the entry animation settle
        await expect(page).toHaveScreenshot(`${o.id}--${o.name}--open--${theme}.png`);
      });
    }
  });
}
