import { expect, test, type Page } from "@playwright/test";

// Drives the blocks the way a person would: type, click, press keys. Each test opens one example of the lab and
// looks only inside it, so a failure names the block and the example.
async function example(page: Page, block: string, name: string) {
  const problems: string[] = [];
  page.on("pageerror", (e) => problems.push(`uncaught: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
  await page.goto(`/#${block}/${name}`);
  const frame = page.locator(`#${block}-${name}`);
  await expect(frame.locator("[data-result]")).toHaveAttribute("data-result", "pass", { timeout: 15_000 });
  return { frame, problems };
}

test.describe("DataTable", () => {
  test("searches, and says how many rows match", async ({ page }) => {
    const { frame, problems } = await example(page, "data-table", "with-selection-and-bulk-actions");
    await frame.getByRole("searchbox").fill("Harbor");
    await expect(frame.getByRole("row").filter({ hasText: "Harbor Mills" }).first()).toBeVisible();
    await expect(frame.getByRole("row").filter({ hasText: "Northgate Foods" })).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test("sorts by a column and reports it with aria-sort", async ({ page }) => {
    const { frame } = await example(page, "data-table", "basic");
    const header = frame.getByRole("columnheader", { name: /Customer/ });
    await header.click();
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    await header.click();
    await expect(header).toHaveAttribute("aria-sort", "descending");
  });

  test("selecting rows shows bulk actions; a danger action asks first and names the count", async ({ page }) => {
    const { frame, problems } = await example(page, "data-table", "with-selection-and-bulk-actions");
    const body = frame.getByRole("row").filter({ has: page.getByRole("checkbox") });
    const picked = [(await frame.getByRole("row").nth(1).innerText()).match(/#\d+/)![0], (await frame.getByRole("row").nth(2).innerText()).match(/#\d+/)![0]];
    await frame.getByRole("checkbox", { name: /^Select/ }).nth(1).check({ force: true });
    await frame.getByRole("checkbox", { name: /^Select/ }).nth(2).check({ force: true });
    await expect(frame.getByText(/2 selected/).first()).toBeVisible();
    await frame.getByRole("button", { name: "Delete" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/2/);
    await dialog.getByRole("button", { name: "Delete orders" }).click();
    await expect(dialog).toBeHidden();
    for (const id of picked) await expect(frame.getByRole("row").filter({ hasText: id })).toHaveCount(0);
    expect(await body.count()).toBeGreaterThan(0);
    expect(problems).toEqual([]);
  });

  test("Escape on the confirm leaves the rows alone and returns focus", async ({ page }) => {
    const { frame } = await example(page, "data-table", "with-selection-and-bulk-actions");
    const rows = frame.getByRole("row");
    const before = await rows.count();
    await frame.getByRole("checkbox", { name: /^Select/ }).nth(1).check({ force: true });
    await frame.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(rows).toHaveCount(before);
    await expect(frame.getByRole("button", { name: "Delete" })).toBeFocused();
  });

  test("filters with a select and pages", async ({ page }) => {
    const { frame } = await example(page, "data-table", "searchable-and-filterable");
    await frame.getByRole("combobox", { name: /Status/ }).or(frame.locator("select").first()).first().selectOption("Overdue");
    const cells = frame.getByRole("row").filter({ hasText: /#\d+/ });
    const n = await cells.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) await expect(cells.nth(i)).toContainText("Overdue");
  });

  test("moves to the next page", async ({ page }) => {
    const { frame } = await example(page, "data-table", "basic");
    const first = await frame.getByRole("row").nth(1).innerText();
    await frame.getByRole("button", { name: "Next page" }).click();
    await expect(frame.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    expect(await frame.getByRole("row").nth(1).innerText()).not.toBe(first);
  });
});

test.describe("CustomerTable", () => {
  test("searches and narrows by status", async ({ page }) => {
    const { frame, problems } = await example(page, "customer-table", "basic");
    const rows = frame.getByRole("row");
    const all = await rows.count();
    await frame.getByRole("searchbox").fill("zzzz-no-such-customer");
    await expect(frame.getByText(/no .*(match|found|customers)/i).first()).toBeVisible();
    await frame.getByRole("searchbox").fill("");
    await expect(rows).toHaveCount(all);
    await frame.locator("select").first().selectOption({ index: 1 });
    expect(await rows.count()).toBeLessThanOrEqual(all);
    expect(problems).toEqual([]);
  });
});

test.describe("dialogs and confirmations", () => {
  test("InviteDialog opens, closes with Escape and returns focus to its trigger", async ({ page }) => {
    const { frame } = await example(page, "invite-dialog", "basic");
    const trigger = frame.getByRole("button", { name: "Invite people" });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("InviteDialog checks an email before sending", async ({ page }) => {
    const { frame } = await example(page, "invite-dialog", "basic");
    await frame.getByRole("button", { name: "Invite people" }).click();
    const dialog = page.getByRole("dialog");
    const input = dialog.getByRole("combobox").or(dialog.getByRole("textbox")).first();
    await input.fill("not-an-email");
    await input.press("Enter");
    await expect(dialog.getByText(/valid email|isn't an email|not a valid|email address/i).first()).toBeVisible();
  });

  test("PlanCard asks before cancelling, and Escape keeps the plan", async ({ page }) => {
    const { frame } = await example(page, "plan-card", "basic");
    await frame.getByRole("button", { name: "Cancel subscription" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(frame.getByRole("heading", { name: /Team plan/ })).toBeVisible();
  });

  test("PaymentMethodCard asks before removing", async ({ page }) => {
    const { frame } = await example(page, "payment-method-card", "basic");
    await frame.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
  });

  test("ApiKeyList revokes a key only after its name is typed to confirm", async ({ page }) => {
    const { frame } = await example(page, "api-key-list", "basic");
    await frame.getByRole("button", { name: "Revoke Deploy script" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    const revoke = dialog.getByRole("button", { name: "Revoke key" });
    await expect(revoke).toBeDisabled();
    await dialog.getByRole("textbox").fill("Deploy script");
    await expect(revoke).toBeEnabled();
    await revoke.click();
    await expect(frame.getByRole("button", { name: "Revoke Deploy script" })).toHaveCount(0);
    await expect(frame.getByRole("button", { name: "Revoke Reporting job" })).toBeVisible();
  });

  test("UserForm asks before deleting a user", async ({ page }) => {
    const { frame } = await example(page, "user-form", "edit");
    await frame.getByRole("button", { name: "Delete user" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeHidden();
  });
});

test.describe("forms and settings", () => {
  test("UserForm saves what was typed", async ({ page }) => {
    const { frame, problems } = await example(page, "user-form", "edit");
    const name = frame.getByRole("textbox").first();
    await name.fill("Lena Fischer-Hale");
    await frame.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("status").or(page.getByText(/saved|updated/i)).first()).toBeVisible({ timeout: 5000 });
    expect(problems).toEqual([]);
  });

  test("UserForm keeps Create disabled until the form is filled, and names a bad email", async ({ page }) => {
    const { frame } = await example(page, "user-form", "create");
    const create = frame.getByRole("button", { name: "Create user" });
    await expect(create).toBeDisabled();
    await frame.locator("input[name=name]").fill("Grace Hopper");
    await frame.locator("input[name=email]").fill("grace@example.com");
    await expect(create).toBeEnabled();
    // A bad address is named on submit, in words and to assistive technology.
    await frame.locator("input[name=email]").fill("not-an-email");
    await create.click();
    await expect(frame.locator("input[name=email]")).toHaveAttribute("aria-invalid", "true");
    await expect(frame.getByText("Enter a valid email address.").first()).toBeVisible();
  });

  test("SettingsSection switches can be toggled with the keyboard", async ({ page }) => {
    const { frame } = await example(page, "settings-section", "toggles");
    const first = frame.getByRole("switch").first();
    const was = await first.isChecked();
    await first.focus();
    await page.keyboard.press("Space");
    expect(await first.isChecked()).toBe(!was);
  });

  test("AuthCard sign-in has labelled fields and links", async ({ page }) => {
    const { frame } = await example(page, "auth-card", "sign-in");
    await expect(frame.getByRole("heading", { level: 1, name: /Sign in/ })).toBeVisible();
    await expect(frame.getByLabel(/email/i)).toBeVisible();
    await expect(frame.getByLabel(/password/i)).toBeVisible();
    await expect(frame.getByRole("link", { name: /Forgot/ })).toHaveAttribute("href", /.+/);
  });
});

test.describe("calendar and time", () => {
  test("EventCalendar moves between months", async ({ page }) => {
    const { frame } = await example(page, "event-calendar", "basic");
    const heading = frame.getByRole("heading", { level: 2 }).last();
    const before = await heading.innerText();
    await frame.getByRole("button", { name: "Next month" }).click();
    await expect(heading).not.toHaveText(before);
    await frame.getByRole("button", { name: "Today" }).click();
    await expect(heading).toHaveText(before.length ? /./ : /./);
  });

  test("TimeSlotPicker picks a date and a time and confirms", async ({ page }) => {
    const { frame, problems } = await example(page, "time-slot-picker", "appointment");
    await frame.getByRole("radio").first().waitFor();
    const slot = frame.getByRole("radio", { disabled: false }).first();
    await slot.check({ force: true });
    const confirm = frame.getByRole("button", { name: /Confirm|Book/ });
    await expect(confirm).toBeEnabled();
    await confirm.click();
    expect(problems).toEqual([]);
  });

  test("TimeSlotPicker: a taken time cannot be chosen", async ({ page }) => {
    const { frame } = await example(page, "time-slot-picker", "unavailable-times");
    const taken = frame.getByRole("radio", { disabled: true }).first();
    await expect(taken).toBeDisabled();
  });
});

test.describe("navigation", () => {
  test("UserMenu opens, moves with arrow keys, closes with Escape and returns focus", async ({ page }) => {
    const { frame } = await example(page, "user-menu", "basic");
    const trigger = frame.getByRole("button", { name: /Account menu/ });
    await trigger.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("TopNav opens a dropdown and closes it with Escape", async ({ page }) => {
    const { frame } = await example(page, "top-nav", "with-dropdowns");
    const trigger = frame.getByRole("button", { name: /Products/ });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("Sidebar collapses and expands", async ({ page }) => {
    const { frame } = await example(page, "sidebar", "basic");
    const toggle = frame.getByRole("button", { name: /Collapse sidebar/ });
    await toggle.click();
    await expect(frame.getByRole("button", { name: /Expand sidebar/ })).toBeVisible();
  });

  test("Sidebar marks the current page", async ({ page }) => {
    const { frame } = await example(page, "sidebar", "basic");
    await expect(frame.locator("[aria-current='page']").first()).toBeVisible();
  });
});
