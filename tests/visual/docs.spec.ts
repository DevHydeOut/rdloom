import { expect, test } from "@playwright/test";

// How the docs site behaves for a reader: finding a component, installing it,
// reading its code. Runs against the built site (see playwright.config.ts).

test.describe("component page", () => {
  // The outline column shows from 1280px up.
  test.use({ viewport: { width: 1440, height: 900 } });

  test("has the page outline, a live preview and an install command", async ({ page }) => {
    await page.goto("/components/alert");
    await expect(page.getByRole("heading", { level: 1, name: "Alert" })).toBeVisible();
    const outline = page.getByRole("navigation", { name: "On this page" });
    await expect(outline.getByRole("link", { name: "Installation" })).toBeVisible();
    await expect(outline.getByRole("link", { name: "API Reference" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "CLI" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByLabel("Add command for npm")).toContainText("npx rdloom add alert");
  });

  test("remembers the package manager across components", async ({ page }) => {
    await page.goto("/components/alert");
    await page.getByRole("tab", { name: "pnpm" }).first().click();
    await expect(page.getByLabel("Add command for pnpm")).toContainText("pnpm dlx rdloom add alert");
    await page.getByRole("link", { name: "Avatar", exact: true }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Avatar" })).toBeVisible();
    await expect(page.getByLabel("Add command for pnpm")).toContainText("pnpm dlx rdloom add avatar");
  });

  test("folds the code until you ask for it", async ({ page }) => {
    await page.goto("/components/alert");
    const view = page.getByRole("button", { name: "View Code" }).first();
    await expect(view).toHaveAttribute("aria-expanded", "false");
    await view.click();
    await expect(page.getByRole("button", { name: "Hide code" }).first()).toBeVisible();
  });

  test("shows the source to copy on the Manual tab", async ({ page }) => {
    await page.goto("/components/alert");
    await page.getByRole("tab", { name: "Manual" }).click();
    await expect(page.getByText("src/components/rdloom/alert/alert.tsx")).toBeVisible();
  });

  test("steps to the neighbouring components", async ({ page }) => {
    await page.goto("/components/alert");
    await page.getByRole("link", { name: "Next: Avatar" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Avatar" })).toBeVisible();
    await page.getByRole("link", { name: "Previous: Alert" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Alert" })).toBeVisible();
  });
});

test.describe("finding things", () => {
  test("Ctrl+K searches the docs and opens the page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle"); // the shortcut works once the page has hydrated
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Search the docs" });
    await expect(dialog).toBeVisible();
    await page.keyboard.type("date range");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 1, name: "Date Range Picker" })).toBeVisible();
  });

  test("the components page filters by name or purpose", async ({ page }) => {
    await page.goto("/components");
    await page.getByLabel("Filter components").fill("upload");
    const cards = page.getByRole("main");
    await expect(cards.getByRole("link", { name: /File Upload/ })).toBeVisible();
    await expect(cards.getByRole("link", { name: /^Button/ })).toHaveCount(0);
    await page.getByLabel("Filter components").fill("zzzz");
    await expect(page.getByText("Nothing matches")).toBeVisible();
  });

  test("the sidebar lists components alphabetically with readable names", async ({ page }) => {
    await page.goto("/components/button");
    const names = await page.getByRole("navigation", { name: "Docs" }).getByRole("link").allInnerTexts();
    const components = names.slice(names.indexOf("All components") + 1);
    expect(components).toContain("Data Grid");
    expect(components).toEqual([...components].sort((a, b) => a.localeCompare(b)));
  });
});

test.describe("small screens", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("opens the menu, with no sideways scrolling", async ({ page }) => {
    await page.goto("/components/table");
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("navigation", { name: "Docs" }).getByRole("link", { name: "Accordion" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
