import { expect, test, type Page } from "@playwright/test";

// What a block does when the app says "not allowed" or the data is loading, empty or broken.
async function open(page: Page, block: string, name: string) {
  const problems: string[] = [];
  page.on("pageerror", (e) => problems.push(`uncaught: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
  await page.goto(`/#${block}/${name}`);
  const frame = page.locator(`#${block}-${name}`);
  await expect(frame.locator("[data-result]")).toHaveAttribute("data-result", "pass", { timeout: 15_000 });
  return { frame, problems };
}

// [block, example, control name, the reason the page gives for it]
const denied: Array<[string, string, string, string]> = [
  ["plan-card", "permissions", "Change plan", "Only the billing owner can change the plan."],
  ["plan-card", "permissions", "Cancel subscription", "Only the billing owner can cancel."],
  ["api-key-list", "permissions", "Create key", "Only admins can create keys."],
  ["api-key-list", "permissions", "Revoke Deploy script", "Only admins can revoke keys."],
  ["payment-method-card", "permissions", "Remove", "A workspace needs one payment method. Add another first."],
  ["usage-meter", "permissions", "Upgrade", "Ask a billing owner to upgrade the plan."],
  ["data-table", "permissions", "Export CSV", "Only finance can export orders"],
  ["customer-table", "permissions", "Export CSV", "Only admins can export customers"],
  ["user-form", "permissions", "Delete user", "Only owners can delete users."],
  ["user-form", "permissions", "Suspend", "Only owners can suspend users."],
  ["app-header", "permissions", "Notifications", "Notifications are off for guests"],
  ["top-nav", "permissions", "Reports", "Reports are part of the Team plan"],
  ["sidebar", "permissions", "Reports", "Reports are part of the Team plan"],
  ["dashboard-shell", "permissions", "Reports", "Reports are part of the Team plan"],
];

test.describe("a denied action", () => {
  for (const [block, name, control, reason] of denied) {
    test(`${block} · ${control}: stays focusable, says why, and does nothing`, async ({ page }) => {
      const { frame, problems } = await open(page, block, name);
      const target = frame.getByRole("button", { name: control, exact: true }).or(frame.getByRole("link", { name: control, exact: true })).first();
      await expect(target).toHaveAttribute("aria-disabled", "true");
      // The reason is read with the control, not only shown on hover.
      const text = await target.evaluate((el) =>
        (el.getAttribute("aria-describedby") ?? "")
          .split(" ")
          .map((id) => document.getElementById(id)?.textContent ?? "")
          .join(" "),
      );
      expect(text, "the reason is not linked with aria-describedby").toContain(reason);
      // Still reachable by keyboard, but pressing it opens nothing.
      await target.focus();
      await expect(target).toBeFocused();
      await page.keyboard.press("Enter");
      await target.click({ force: true });
      await expect(page.getByRole("alertdialog")).toHaveCount(0);
      await expect(page.getByRole("dialog")).toHaveCount(0);
      expect(problems).toEqual([]);
    });
  }
});

test.describe("states", () => {
  test("PlanCard offers a way forward when there is no plan and when loading failed", async ({ page }) => {
    const { frame } = await open(page, "plan-card", "states");
    await expect(frame.getByRole("button", { name: "Choose a plan" })).toBeEnabled();
    await expect(frame.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  test("ApiKeyList: empty and error states each have their action", async ({ page }) => {
    const { frame } = await open(page, "api-key-list", "states");
    await expect(frame.getByRole("heading", { name: "No API keys yet" })).toBeVisible();
    await expect(frame.getByRole("heading", { name: /Couldn.t load your API keys/ })).toBeVisible();
    await expect(frame.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  const empties = [
    ["payment-method-card", "empty-and-states", "No payment method yet", /Couldn.t load your payment method/],
    ["event-calendar", "states", "No events this month", /Couldn.t load events/],
    ["usage-meter", "states", "No usage to show yet", /Couldn.t load usage/],
  ] as const;
  for (const [block, name, empty, error] of empties) {
    test(`${block}: empty and error states are shown with headings`, async ({ page }) => {
      const { frame } = await open(page, block, name);
      await expect(frame.getByRole("heading", { name: empty })).toBeVisible();
      await expect(frame.getByRole("heading", { name: error })).toBeVisible();
      await expect(frame.getByRole("button", { name: "Try again" })).toBeEnabled();
    });
  }

  test("DataTable moves through loading, empty, error and ready", async ({ page }) => {
    const { frame, problems } = await open(page, "data-table", "states");
    for (const state of ["loading", "empty", "error", "ready"]) {
      await frame.getByRole("button", { name: state, exact: true }).click();
      if (state === "loading") await expect(frame.locator("[aria-busy='true']").first()).toBeVisible();
      if (state === "empty") await expect(frame.getByText(/no .*(orders|results|rows|data)|nothing/i).first()).toBeVisible();
      if (state === "error") await expect(frame.getByRole("button", { name: /Try again|Retry/ })).toBeVisible();
      if (state === "ready") await expect(frame.getByRole("row").nth(1)).toContainText(/#\d+/);
    }
    expect(problems).toEqual([]);
  });

  test("CustomerTable moves through loading, empty and error", async ({ page }) => {
    const { frame, problems } = await open(page, "customer-table", "loading-and-empty");
    await frame.getByRole("button", { name: "Loading", exact: true }).click();
    await expect(frame.locator("[aria-busy='true']").first()).toBeVisible();
    await frame.getByRole("button", { name: "Empty", exact: true }).click();
    await expect(frame.getByText(/no customers|nothing|no results/i).first()).toBeVisible();
    await frame.getByRole("button", { name: "Error", exact: true }).click();
    await expect(frame.getByRole("button", { name: /Try again|Retry/ })).toBeVisible();
    expect(problems).toEqual([]);
  });
});

test.describe("layout", () => {
  const widths = ["375", "768"];
  const examples: Array<[string, string]> = [
    ["data-table", "basic"], ["customer-table", "basic"], ["plan-card", "basic"], ["payment-method-card", "basic"], ["api-key-list", "basic"],
    ["event-calendar", "basic"], ["time-slot-picker", "appointment"], ["user-form", "edit"], ["invite-dialog", "basic"], ["settings-section", "toggles"],
    ["usage-meter", "list"], ["auth-card", "sign-in"], ["app-footer", "columns"], ["page-header", "with-breadcrumbs-and-tabs"], ["section-header", "with-divider"],
  ];
  for (const w of widths) {
    for (const [block, name] of examples) {
      test(`${block}/${name} fits in ${w}px without sideways scrolling`, async ({ page }) => {
        await page.goto(`/#${block}/${name}`);
        await page.getByRole("toolbar", { name: "Test controls" }).getByLabel("Width").selectOption(w);
        const frame = page.locator(`#${block}-${name}`);
        await expect(frame.locator("[data-result]")).toHaveAttribute("data-result", "pass", { timeout: 15_000 });
        const box = frame.locator("> div").last();
        const [scroll, client] = await box.evaluate((el) => [el.scrollWidth, el.clientWidth]);
        expect(scroll, `content is ${scroll}px wide in a ${client}px frame`).toBeLessThanOrEqual(client + 1);
      });
    }
  }
});
