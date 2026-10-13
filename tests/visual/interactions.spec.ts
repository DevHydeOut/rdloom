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

// Things a tester hit on the live site, kept here so they cannot come back.
test.describe("docs site basics", () => {
  for (const [typed, shown] of [
    ["DataGrid", "Data Grid"],
    ["datagrid", "Data Grid"],
    ["TextField", "Text Field"],
    ["data grid", "Data Grid"],
  ] as const) {
    test(`search for "${typed}" finds ${shown}`, async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /Search the docs/ }).first().click();
      await page.keyboard.type(typed);
      await expect(page.getByRole("dialog", { name: "Search the docs" }).getByText(shown, { exact: true }).first()).toBeVisible();
    });
  }

  test("a copy button always says what happened, even when the clipboard is blocked", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("blocked")) }, configurable: true });
      document.execCommand = () => false;
    });
    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
    const button = page.getByRole("button", { name: "Copy init command" });
    await button.click();
    await expect(page.getByText(/Copy failed/).first()).toBeVisible();
  });

  test("a copy button confirms a successful copy", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Copy init command" }).click();
    await expect(page.getByText("Copied").first()).toBeVisible();
  });

  test("the invite example names the problem with a wrong email address", async ({ page }) => {
    await page.goto("/components/dialog", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Invite member" }).first().click();
    await page.getByLabel(/Email/).fill("not-an-email");
    await page.getByRole("button", { name: "Send invite" }).click();
    await expect(page.locator("[slot=errorMessage]").getByText("Enter a valid email address, like name@example.com.")).toBeVisible();
  });
});

test("the simulated chat goes through failure, Try again, approval and a finished reply", async ({ page }) => {
  await page.goto("/visual/chat/simulated-run");
  await page.locator("[data-visual-ready]").waitFor({ state: "attached" });
  await page.getByRole("button", { name: /this one breaks once/ }).click();
  await expect(page.getByRole("button", { name: /Try again/ })).toBeVisible({ timeout: 8000 });
  await page.getByRole("button", { name: /Try again/ }).click();
  await expect(page.getByText(/refunds stayed under 2%/)).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole("button", { name: /Try again/ })).toHaveCount(0);
});

test("the simulated chat asks before it sends", async ({ page }) => {
  await page.goto("/visual/chat/simulated-run");
  await page.locator("[data-visual-ready]").waitFor({ state: "attached" });
  await page.getByRole("button", { name: /send the report/ }).click();
  await page.getByRole("button", { name: /Approve|Allow/ }).first().click({ timeout: 10000 });
  await expect(page.getByText("Sent to finance.")).toBeVisible({ timeout: 8000 });
});
