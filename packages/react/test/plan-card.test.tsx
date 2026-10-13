import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PlanCard, PlanPicker, type PlanCardProps, type PlanOption } from "../src";
import { axeViolations } from "./axe";

const plan = { name: "Team plan", price: 49, interval: "month" as const, features: ["Up to 10 seats", "5 GB of storage"] };

function Card(props: Partial<PlanCardProps>) {
  return <PlanCard plan={plan} periodEnd="2027-03-03" onChangePlan={() => {}} onCancel={() => {}} {...props} />;
}

describe("PlanCard", () => {
  it("is a group named by the plan with the price, the interval and the renewal date", () => {
    render(<Card usageHint="8 of 10 seats used" />);
    expect(screen.getByRole("group", { name: "Team plan" })).toBeInTheDocument();
    expect(screen.getByText("$49")).toBeInTheDocument();
    expect(screen.getByText(/per month/)).toBeInTheDocument();
    expect(screen.getByText("Renews on March 3, 2027")).toBeInTheDocument();
    expect(screen.getByText("8 of 10 seats used")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("lists the features in a named list", () => {
    render(<Card />);
    const list = screen.getByRole("list", { name: "Team plan includes" });
    expect(within(list).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Up to 10 seats", "5 GB of storage"]);
  });

  it("formats prices for the currency and locale", () => {
    render(<Card plan={{ ...plan, price: 49.5, currency: "EUR", interval: "year" }} locale="de-DE" periodEnd="2027-03-03" />);
    expect(screen.getByText(/49,50/)).toBeInTheDocument();
    expect(screen.getByText(/per year/)).toBeInTheDocument();
    expect(screen.getByText(/3\. März 2027/)).toBeInTheDocument();
  });

  it.each([
    ["trialing", "Trial", "Trial ends on March 3, 2027"],
    ["past_due", "Past due", "Payment failed. Renewal was due on March 3, 2027"],
    ["canceled", "Canceled", "Ends on March 3, 2027"],
  ] as const)("says %s in words", (status, badge, line) => {
    render(<Card status={status} />);
    expect(screen.getByText(badge)).toBeInTheDocument();
    expect(screen.getByText(line)).toBeInTheDocument();
  });

  it("shows the past due alert with a way to fix the payment", async () => {
    const onUpdatePayment = vi.fn();
    const u = userEvent.setup();
    render(<Card status="past_due" onUpdatePayment={onUpdatePayment} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Your last payment failed");
    await u.click(within(alert).getByRole("button", { name: "Update payment method" }));
    expect(onUpdatePayment).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeNull();
  });

  it("shows no alert unless the payment failed", () => {
    render(<Card status="active" />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("runs Change plan", async () => {
    const onChangePlan = vi.fn();
    const u = userEvent.setup();
    render(<Card onChangePlan={onChangePlan} />);
    await u.click(screen.getByRole("button", { name: "Change plan" }));
    expect(onChangePlan).toHaveBeenCalledTimes(1);
  });

  it("asks before cancelling, states the end date, and only then cancels and announces it", async () => {
    const onCancel = vi.fn();
    const u = userEvent.setup();
    render(<Card onCancel={onCancel} />);
    await u.click(screen.getByRole("button", { name: "Cancel subscription" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("You keep access to Team plan until March 3, 2027.");
    expect(onCancel).not.toHaveBeenCalled();
    await u.click(within(dialog).getByRole("button", { name: "Keep my plan" }));
    expect(onCancel).not.toHaveBeenCalled();
    await u.click(screen.getByRole("button", { name: "Cancel subscription" }));
    await u.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel subscription" }));
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText("Subscription canceled. You keep access until March 3, 2027.")).toBeInTheDocument());
  });

  it("explains the end of the period when there is no date", async () => {
    const u = userEvent.setup();
    render(<Card periodEnd={undefined} />);
    await u.click(screen.getByRole("button", { name: "Cancel subscription" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("until the end of the current period");
  });

  it("cancels the confirmation with Escape", async () => {
    const u = userEvent.setup();
    const onCancel = vi.fn();
    render(<Card onCancel={onCancel} />);
    await u.click(screen.getByRole("button", { name: "Cancel subscription" }));
    await screen.findByRole("alertdialog");
    await u.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(onCancel).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel subscription" })).toHaveFocus());
  });

  it("offers a new plan instead of cancelling once canceled", () => {
    render(<Card status="canceled" />);
    expect(screen.queryByRole("button", { name: "Cancel subscription" })).toBeNull();
    expect(screen.getByRole("button", { name: "Choose a plan" })).toBeInTheDocument();
  });

  describe("states", () => {
    it("shows a skeleton while loading", () => {
      const { container } = render(<PlanCard state="loading" />);
      expect(container.querySelector("[aria-busy=true]")).not.toBeNull();
    });

    it("offers Choose a plan when there is no plan", async () => {
      const onChangePlan = vi.fn();
      const u = userEvent.setup();
      render(<PlanCard onChangePlan={onChangePlan} />);
      expect(screen.getByText("You are not on a plan yet")).toBeInTheDocument();
      await u.click(screen.getByRole("button", { name: "Choose a plan" }));
      expect(onChangePlan).toHaveBeenCalled();
    });

    it("shows an error with a retry", async () => {
      const onRetry = vi.fn();
      const u = userEvent.setup();
      render(<PlanCard state="error" onRetry={onRetry} />);
      await u.click(screen.getByRole("button", { name: "Try again" }));
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe("permissions", () => {
    it("keeps disabled actions reachable with the reason and runs nothing", async () => {
      const onChangePlan = vi.fn();
      const onCancel = vi.fn();
      const u = userEvent.setup();
      render(
        <Card
          onChangePlan={onChangePlan}
          onCancel={onCancel}
          permissions={{ changePlan: { state: "disabled", reason: "Owners only." }, cancel: { state: "disabled", reason: "Billing owners only." } }}
        />,
      );
      const change = screen.getByRole("button", { name: "Change plan" });
      expect(change).toHaveAttribute("aria-disabled", "true");
      expect(change).toHaveAccessibleDescription("Owners only.");
      await u.click(change);
      const cancel = screen.getByRole("button", { name: "Cancel subscription" });
      expect(cancel).toHaveAccessibleDescription("Billing owners only.");
      await u.click(cancel);
      expect(screen.queryByRole("alertdialog")).toBeNull();
      expect(onChangePlan).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("leaves a hidden action out", () => {
      render(<Card permissions={{ cancel: "hidden" }} />);
      expect(screen.queryByRole("button", { name: "Cancel subscription" })).toBeNull();
      expect(screen.getByRole("button", { name: "Change plan" })).toBeInTheDocument();
    });
  });

  it("puts a class name on every part", () => {
    const names = ["root", "header", "name", "status", "price", "renewal", "features", "feature", "usage", "alert", "actions", "changeButton", "cancelButton", "updateButton"] as const;
    const classNames = Object.fromEntries(names.map((n) => [n, `c-${n}`]));
    const { container } = render(<Card status="past_due" usageHint="8 of 10" onUpdatePayment={() => {}} classNames={classNames} />);
    for (const n of names) expect(container.querySelector(`.c-${n}`), n).not.toBeNull();
  });

  it("has no axe violations in each status, in each state and with the dialog open", async () => {
    for (const status of ["active", "trialing", "past_due", "canceled"] as const) {
      const { container, unmount } = render(<Card status={status} usageHint="8 of 10 seats used" onUpdatePayment={() => {}} />);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
    for (const state of ["loading", "empty", "error"] as const) {
      const { container, unmount } = render(<PlanCard state={state} onChangePlan={() => {}} onRetry={() => {}} />);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
    const u = userEvent.setup();
    render(<Card />);
    await u.click(screen.getByRole("button", { name: "Cancel subscription" }));
    expect(await axeViolations(await screen.findByRole("alertdialog"))).toEqual([]);
  });

  it("renders on the server", () => {
    const html = renderToString(<Card />);
    expect(html).toContain("Team plan");
    expect(html).toContain("Renews on March 3, 2027");
  });
});

const plans: PlanOption[] = [
  { id: "starter", name: "Starter", prices: { month: 19, year: 190 }, features: ["Up to 3 seats"] },
  { id: "team", name: "Team", prices: { month: 49, year: 490 }, badge: "Most popular", features: ["Up to 10 seats"] },
  { id: "business", name: "Business", prices: { month: 129, year: 1290 } },
];

describe("PlanPicker", () => {
  it("is a radio group of plans with the current one marked and selected", () => {
    render(<PlanPicker plans={plans} currentPlanId="team" onSelectPlan={() => {}} />);
    const group = screen.getByRole("radiogroup", { name: "Plans" });
    expect(within(group).getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "Team, $49 per month, current plan" })).toBeChecked();
    expect(screen.getByText("Current plan")).toBeInTheDocument();
    expect(screen.getByText("Most popular")).toBeInTheDocument();
    expect(screen.getByText("This is your current plan.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to Team" })).toBeDisabled();
  });

  it("moves between plans with the arrow keys and offers the switch", async () => {
    const onSelectPlan = vi.fn();
    const u = userEvent.setup();
    render(<PlanPicker plans={plans} currentPlanId="team" onSelectPlan={onSelectPlan} />);
    screen.getByRole("radio", { name: /^Team/ }).focus();
    await u.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: /^Business/ })).toBeChecked();
    await u.click(screen.getByRole("button", { name: "Switch to Business" }));
    await waitFor(() => expect(onSelectPlan).toHaveBeenCalledWith("business", "month"));
  });

  it("switches the prices and the reported interval with the toggle", async () => {
    const onSelectPlan = vi.fn();
    const onIntervalChange = vi.fn();
    const u = userEvent.setup();
    render(<PlanPicker plans={plans} currentPlanId="team" onSelectPlan={onSelectPlan} onIntervalChange={onIntervalChange} />);
    await u.click(screen.getByRole("radio", { name: /^Starter/ }));
    await u.click(screen.getByRole("radio", { name: "Yearly" }));
    expect(onIntervalChange).toHaveBeenCalledWith("year");
    expect(screen.getByRole("radio", { name: "Starter, $190 per year" })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Switch to Starter" }));
    await waitFor(() => expect(onSelectPlan).toHaveBeenCalledWith("starter", "year"));
  });

  it("says how much yearly saves, and lets you word it", () => {
    const { rerender } = render(<PlanPicker plans={plans} onSelectPlan={() => {}} />);
    expect(screen.getByText("Save up to 17% with yearly billing")).toBeInTheDocument();
    rerender(<PlanPicker plans={plans} yearlyNote="2 months free" onSelectPlan={() => {}} />);
    expect(screen.getByText("2 months free with yearly billing")).toBeInTheDocument();
  });

  it("treats the same plan on another interval as a change", async () => {
    const u = userEvent.setup();
    render(<PlanPicker plans={plans} currentPlanId="team" currentInterval="month" onSelectPlan={() => {}} />);
    await u.click(screen.getByRole("radio", { name: "Yearly" }));
    expect(screen.getByRole("button", { name: "Switch to Team" })).not.toBeDisabled();
  });

  it("can be controlled", async () => {
    const onValueChange = vi.fn();
    const u = userEvent.setup();
    render(<PlanPicker plans={plans} value="starter" onValueChange={onValueChange} onSelectPlan={() => {}} />);
    await u.click(screen.getByRole("radio", { name: /^Business/ }));
    expect(onValueChange).toHaveBeenCalledWith("business");
    expect(screen.getByRole("radio", { name: /^Starter/ })).toBeChecked();
  });

  describe("permissions", () => {
    it("keeps the button reachable with the reason and selects nothing", async () => {
      const onSelectPlan = vi.fn();
      const u = userEvent.setup();
      render(<PlanPicker plans={plans} currentPlanId="team" onSelectPlan={onSelectPlan} permissions={{ select: { state: "disabled", reason: "Owners only." } }} />);
      await u.click(screen.getByRole("radio", { name: /^Business/ }));
      const button = screen.getByRole("button", { name: "Switch to Business" });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAccessibleDescription("Owners only.");
      await u.click(button);
      expect(onSelectPlan).not.toHaveBeenCalled();
    });

    it("renders nothing when hidden", () => {
      const { container } = render(<PlanPicker plans={plans} onSelectPlan={() => {}} permissions={{ select: "hidden" }} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  it("puts a class name on every part", () => {
    const names = ["root", "interval", "plans", "plan", "badge", "features", "actions", "selectButton", "hint"] as const;
    const classNames = Object.fromEntries(names.map((n) => [n, `c-${n}`]));
    const { container } = render(<PlanPicker plans={plans} currentPlanId="team" onSelectPlan={() => {}} classNames={classNames} />);
    for (const n of names) expect(container.querySelector(`.c-${n}`), n).not.toBeNull();
  });

  it("has no axe violations and renders on the server", async () => {
    const { container } = render(<PlanPicker plans={plans} currentPlanId="team" onSelectPlan={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
    expect(renderToString(<PlanPicker plans={plans} onSelectPlan={() => {}} />)).toContain("Starter");
  });
});
