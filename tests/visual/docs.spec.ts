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
    await page.getByRole("link", { name: "Next: Approval Box" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Approval Box" })).toBeVisible();
    await expect(page.getByLabel("Add command for pnpm")).toContainText("pnpm dlx rdloom add approval-box");
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

  test("a motion component explains the one stylesheet it needs, and a plain transition doesn't", async ({ page }) => {
    await page.goto("/components/shimmer-button");
    await expect(page.getByText("Optional, and kept apart.")).toBeVisible();
    await expect(page.getByText(/imports it from the tokens file, once/)).toBeVisible();
    await page.getByRole("tab", { name: "Manual" }).click();
    await expect(page.getByText("Add the motion stylesheet, and import it.")).toBeVisible();
    await expect(page.locator('pre[aria-label="Import the motion CSS"]')).toContainText('@import "./rdloom-motion.css";');

    // BlurFade is only a transition: nothing to import.
    await page.goto("/components/blur-fade");
    await page.getByRole("tab", { name: "Manual" }).click();
    await expect(page.getByText("Add the motion stylesheet, and import it.")).toHaveCount(0);
  });

  test("an AI component says it brings no model, and links to the guide", async ({ page }) => {
    await page.goto("/components/chat");
    await expect(page.getByText("Bring your own model.")).toBeVisible();
    await page.getByRole("link", { name: "message shape" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "AI interfaces" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "What is different about accessibility" })).toBeVisible();
  });

  test("the chat example answers, streams, and says when it is done", async ({ page }) => {
    await page.goto("/components/chat");
    await page.waitForLoadState("networkidle"); // the page is prerendered: wait until it is interactive
    const box = page.getByRole("textbox", { name: "Message" }).first();
    await box.fill("What is rdloom?");
    await box.press("Enter");
    // the reply streams in; the list itself is not a live region, a single status line speaks
    await expect(page.getByRole("article", { name: "Assistant message" }).first()).toContainText("Want a tour of the data grid next?", { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Send message" }).first()).toBeVisible();
    await expect(page.getByRole("log", { name: "Assistant messages" }).first()).toHaveAttribute("aria-live", "off");
    await expect(page.getByText("Response complete").first()).toBeAttached();
  });

  test("a tool that needs approval takes focus on its question, and the answer returns focus to the tool", async ({ page }) => {
    await page.goto("/components/chat");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Show me sales from last month" }).click();
    const question = page.getByRole("group", { name: "Email this report to finance@example.com" });
    await expect(question).toBeFocused({ timeout: 10_000 });
    await page.keyboard.press("Tab"); // Deny
    await page.keyboard.press("Tab"); // Approve
    await page.keyboard.press("Enter");
    await expect(question).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Email the report to finance/ })).toBeFocused();
  });

  test("a chart can be read as a table", async ({ page }) => {
    await page.goto("/components/generated-chart");
    await page.waitForLoadState("networkidle");
    const chart = page.getByRole("figure", { name: "Revenue by month" });
    await expect(chart).toContainText("reaching $48K in June");
    await chart.getByRole("button", { name: "View as table" }).click();
    await expect(chart.getByRole("table")).toBeVisible();
    await expect(chart.getByRole("rowheader", { name: "Jun" })).toBeVisible();
  });

  test("the whole Copy page button copies, not only its icon", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/components/alert");
    await page.waitForLoadState("networkidle");
    // click the words, away from the icon
    await page.getByRole("button", { name: /Copy page/ }).click({ position: { x: 12, y: 14 } });
    await expect(page.getByRole("button", { name: /Copied/ })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("# Alert");
  });

  test("a heading has a button that copies the link to its section", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/components/alert");
    await page.waitForLoadState("networkidle");
    const heading = page.getByRole("heading", { level: 2, name: "Installation" });
    await heading.hover();
    await heading.getByRole("button", { name: "Copy link to Installation" }).click();
    await expect(heading.getByText("Link copied")).toBeAttached();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/components\/alert#installation$/);
    // the heading is plain text now, not a link with a # after it
    await expect(heading.getByRole("link")).toHaveCount(0);
  });

  test("previews keep their content in the middle, also after something is dismissed", async ({ page }) => {
    await page.goto("/components/alert");
    await page.waitForLoadState("networkidle");
    const card = page.locator("main .rounded-xl.overflow-hidden:has(> div.relative.flex)", { hasText: "keyboard shortcuts" });
    await card.getByRole("button", { name: "Dismiss", exact: true }).click();
    const area = await card.locator("> div.relative.flex").boundingBox();
    const again = await card.getByRole("button", { name: "Show the message again" }).boundingBox();
    expect(Math.abs(area!.x + area!.width / 2 - (again!.x + again!.width / 2))).toBeLessThan(4);
  });

  test("a toast closes by itself", async ({ page }) => {
    await page.goto("/components/toast");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Save" }).first().click();
    const toast = page.getByRole("alertdialog").filter({ hasText: "Changes saved" });
    await expect(toast).toBeVisible();
    // 10 seconds by default; the pointer is not over it, so the timer runs
    await page.mouse.move(5, 5);
    await expect(toast).toBeHidden({ timeout: 14_000 });
  });

  test("the customer table filters, sorts, pages and exports in a real browser", async ({ page }) => {
    await page.goto("/components/customer-table");
    await page.waitForLoadState("networkidle");
    const block = page.getByRole("region", { name: "Customers" }).first();
    await expect(block.getByText("24 customers")).toBeVisible();
    await block.getByRole("searchbox", { name: "Search customers" }).fill("hopper");
    await expect(block.getByText("1 customer", { exact: true })).toBeVisible();
    await expect(block.getByRole("grid").getByText("Grace Hopper")).toBeVisible();
    await block.getByRole("searchbox").fill("");
    await block.getByRole("button", { name: /Status/ }).click();
    await page.getByRole("option", { name: "overdue" }).click();
    await expect(block.getByText("3 customers")).toBeVisible();
    await block.getByRole("button", { name: "Clear filters" }).first().click();
    await block.getByRole("button", { name: "Page 2" }).click();
    await expect(block.getByText("Showing 9 to 16 of 24")).toBeVisible();
    const download = page.waitForEvent("download");
    await block.getByRole("button", { name: "Export CSV" }).click();
    expect((await download).suggestedFilename()).toBe("customers.csv");
  });

  test("a chart is explored with the arrow keys and read out", async ({ page }) => {
    await page.goto("/components/chart");
    await page.waitForLoadState("networkidle");
    const chart = page.getByRole("figure", { name: "Revenue by month" }).first();
    const plot = chart.getByRole("group").first();
    await plot.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(chart.getByRole("status")).toContainText("Feb");
    await expect(chart.getByText("$26,500").first()).toBeVisible();
    await chart.getByRole("button", { name: "View as table" }).click();
    await expect(chart.getByRole("table")).toBeVisible();
  });

  test("the dashboard shell folds its sidebar, opens sub-items and marks the current page", async ({ page }) => {
    await page.goto("/components/dashboard-shell");
    await page.waitForLoadState("networkidle");
    const demo = page.locator("main .rounded-xl.overflow-hidden:has(> div.relative.flex)").nth(1);
    const nav = demo.getByRole("navigation", { name: "Main navigation" });
    await expect(nav.getByRole("link", { name: /Customers/ }).or(nav.getByRole("button", { name: /Customers/ })).first()).toBeVisible();
    await expect(nav.locator("[aria-current=page]")).toHaveCount(1);
    await nav.getByRole("button", { name: /Customers/ }).click();
    await expect(nav.locator("[aria-current=page]")).toContainText("Customers");
    await demo.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(demo.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-expanded", "false");
    // the folded sidebar still gives every item its name
    await expect(nav.getByRole("button", { name: /Customers/ })).toBeVisible();
  });

  test("on a phone the shell's sidebar becomes a menu that slides in and closes after a choice", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/components/dashboard-shell");
    await page.waitForLoadState("networkidle");
    const demo = page.locator("main .rounded-xl.overflow-hidden:has(> div.relative.flex)").nth(1);
    await demo.getByRole("button", { name: "Open navigation" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await dialog.getByRole("button", { name: /Customers/ }).click();
    await expect(dialog).toBeHidden();
    await expect(demo.getByRole("heading", { level: 1, name: "Customers" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("steps to the neighbouring components", async ({ page }) => {
    await page.goto("/components/alert");
    await page.getByRole("link", { name: "Next: Approval Box" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Approval Box" })).toBeVisible();
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

  test("the sidebar groups components by purpose, opens the group you are in, and every component has a group", async ({ page }) => {
    await page.goto("/components/shimmer-button");
    await page.waitForLoadState("networkidle");
    const nav = page.getByRole("navigation", { name: "Docs" });
    // Your own group is open; the others are closed but can be opened.
    await expect(nav.getByRole("button", { name: /^Buttons/ })).toHaveAttribute("aria-expanded", "true");
    await expect(nav.getByRole("link", { name: "Shimmer Button" })).toBeVisible();
    await expect(nav.getByRole("button", { name: /^Search and commands/ })).toHaveAttribute("aria-expanded", "false");
    await expect(nav.getByRole("link", { name: "Command Palette" })).toBeHidden();
    await nav.getByRole("button", { name: /^Search and commands/ }).click();
    await expect(nav.getByRole("link", { name: "Command Palette" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Combobox" })).toBeVisible();

    // Nothing is left in the catch-all group.
    await expect(nav.getByRole("button", { name: /^More/ })).toHaveCount(0);

    await nav.getByRole("button", { name: "Expand all" }).click();
    const names = await nav.getByRole("link").allInnerTexts();
    expect(names).toContain("Data Grid");
    expect(names).toContain("Prompt Input");
    await nav.getByRole("button", { name: "Collapse all" }).click();
    await expect(nav.getByRole("link", { name: "Command Palette" })).toBeHidden();
  });

  test("the components page lists the same groups", async ({ page }) => {
    await page.goto("/components");
    const main = page.getByRole("main");
    for (const label of ["Buttons", "Search and commands", "Tables and data", "AI chat and agents", "Motion and effects"]) {
      await expect(main.getByRole("heading", { level: 2, name: label })).toBeVisible();
    }
  });
});

test.describe("small screens", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("opens the menu, with no sideways scrolling", async ({ page }) => {
    await page.goto("/components/table");
    await page.getByRole("button", { name: "Menu" }).click();
    const nav = page.getByRole("navigation", { name: "Docs" });
    await nav.getByRole("button", { name: /^Content and layout/ }).click();
    await expect(nav.getByRole("link", { name: "Accordion" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  for (const path of ["/", "/components", "/docs/getting-started", "/components/data-grid", "/components/chat", "/components/generated-chart", "/docs/ai", "/components/customer-table", "/components/chart", "/components/stat", "/components/dashboard-shell"]) {
    test(`${path} doesn't scroll sideways`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
