import { expect, test } from "@playwright/test";

// Problems found while testing the blocks. Each test states what SHOULD happen and is marked test.fail():
// it passes while the problem exists and starts failing when it is fixed, which is the cue to delete test.fail().
async function open(page: import("@playwright/test").Page, block: string, name: string) {
  await page.goto(`/#${block}/${name}`);
  const frame = page.locator(`#${block}-${name}`);
  await expect(frame.locator("[data-result]")).toHaveAttribute("data-result", "pass", { timeout: 15_000 });
  return frame;
}

test("Sidebar: one example opening a sheet does not make the others on the page inert", async ({ page }) => {
  test.fail(true, "The 'in-a-sheet' example starts with a modal sheet open, which makes every other example on the same page inert (unclickable, hidden from screen readers).");
  await page.goto("/#sidebar");
  await expect(page.locator("[data-result]")).toHaveCount(12, { timeout: 20_000 });
  await expect(page.locator("#sidebar-basic")).not.toHaveJSProperty("inert", true);
});
