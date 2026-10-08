import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// A docs page must not move the page or take focus on its own when it opens:
// no autoFocus in an example that is not inside a dialog, nothing that scrolls itself into view.

interface Entry {
  route: string;
}

const specsDir = join(process.cwd(), "specs");
const entries: Entry[] = readdirSync(specsDir)
  .filter((f) => f.endsWith(".spec.json"))
  .flatMap((f) => {
    const spec = JSON.parse(readFileSync(join(specsDir, f), "utf8")) as { category?: string; examples?: unknown[] };
    if (!spec.examples || spec.examples.length === 0) return [];
    return [{ route: `${spec.category === "block" ? "/blocks" : "/components"}/${f.replace(".spec.json", "")}` }];
  });

// The sidebar page shows a sheet that starts open inside its preview (so the visitor sees it at once), and an open
// dialog takes focus: that page may start with focus inside the sheet.
const opensWithFocusInside = new Set(["/blocks/sidebar"]);

test.describe.configure({ mode: "parallel" });

for (const { route } of entries) {
  test(`${route} opens at the top with no field focused`, async ({ page }) => {
    await page.goto(route);
    await page.waitForTimeout(1500);
    const state = await page.evaluate(() => ({ y: window.scrollY, active: document.activeElement?.id || document.activeElement?.tagName || "" }));
    expect(state.y, "scrollY").toBe(0);
    // The docs move focus to the page title when a page opens; any control or field taking focus is a failure.
    if (!opensWithFocusInside.has(route)) expect(["BODY", "page-title"], `activeElement ${state.active}`).toContain(state.active);
  });
}
