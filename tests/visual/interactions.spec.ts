import { expect, test } from "@playwright/test";

// Behavior that needs a real browser: layout, scrolling and
// IntersectionObserver, which jsdom only fakes. Runs with the screenshot
// tests, against the same /visual/<component>/<example> pages.

test("Combobox async: keyboard alone reaches every result, loading more on the way", async ({ page }) => {
  await page.goto("/visual/combobox/async");
  await page.locator("[data-visual-ready]").waitFor({ state: "attached" });
  await page.keyboard.press("Tab"); // menuTrigger="focus" opens the list
  const listbox = page.getByRole("listbox");
  await expect(listbox.getByRole("option", { name: "User 20" })).toBeAttached();

  const active = () =>
    page.evaluate(() => {
      const id = document.querySelector("[role=combobox]")!.getAttribute("aria-activedescendant");
      const el = id ? document.getElementById(id) : null;
      const box = document.querySelector("[role=listbox]")!.getBoundingClientRect();
      const r = el?.getBoundingClientRect();
      return { text: el?.textContent ?? "", visible: !!r && r.top >= box.top - 1 && r.bottom <= box.bottom + 1 };
    });

  // 200 users, 20 per page. Arrow Down has to scroll the list far enough to
  // trigger each load. Like a user, when a press at the end of what's loaded
  // doesn't move (the next page is on its way), wait and press again.
  let presses = 0;
  while ((await active()).text !== "User 200" && presses < 400) {
    const before = (await active()).text;
    await page.keyboard.press("ArrowDown");
    presses++;
    if ((await active()).text === before) await page.waitForTimeout(150);
    // The highlighted option stays in view (the list scrolls a frame after it moves).
    await expect.poll(async () => (await active()).visible, { timeout: 1000 }).toBe(true);
  }
  const last = await active();
  expect(last).toEqual({ text: "User 200", visible: true });
  await expect(listbox.getByRole("option")).toHaveCount(200);
});

test.describe("DataGrid on a phone", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("first tap selects a cell, a second tap opens the editor (and the keyboard)", async ({ page }) => {
    await page.goto("/visual/data-grid/editing");
    await page.locator("[data-visual-ready]").waitFor({ state: "attached" });
    const cell = page.getByRole("gridcell", { name: "Person 2", exact: true });

    await cell.tap();
    await expect(cell).toBeFocused();
    await expect(page.getByRole("textbox")).toHaveCount(0);

    // A separate tap, not a double-tap (which already edits): a user who
    // selected a cell and then decides to change it.
    await page.waitForTimeout(800);
    await cell.tap();
    const editor = page.getByRole("textbox", { name: "Edit Name" });
    await expect(editor).toBeFocused(); // a focused input is what brings up the phone keyboard
    await expect(editor).toHaveValue("Person 2");

    await editor.fill("Person Two");
    await editor.press("Enter");
    await expect(page.getByRole("gridcell", { name: "Person Two", exact: true })).toBeFocused();
  });

  test("tapping a read-only cell never opens an editor", async ({ page }) => {
    await page.goto("/visual/data-grid/editing");
    await page.locator("[data-visual-ready]").waitFor({ state: "attached" });
    const team = page.getByRole("gridcell", { name: "Platform" }).first();
    await team.tap();
    await page.waitForTimeout(800);
    await team.tap();
    await expect(page.getByRole("textbox")).toHaveCount(0);
  });
});
