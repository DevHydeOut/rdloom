import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PaymentMethodCard, type PaymentMethodCardProps } from "../src";
import { axeViolations } from "./axe";

const method = { id: "pm1", brand: "Credit", last4: "4242", expMonth: 8, expYear: 2029, holder: "Lena Fischer" };
const now = new Date("2026-10-07T00:00:00Z");

function Card(props: Partial<PaymentMethodCardProps>) {
  return <PaymentMethodCard method={method} now={now} onUpdate={() => {}} onRemove={() => {}} onMakeDefault={() => {}} {...props} />;
}

describe("PaymentMethodCard", () => {
  it("is a group named with the last four digits and says them as text", () => {
    render(<Card />);
    const group = screen.getByRole("group", { name: "Payment method, ending in 4242" });
    expect(group).toHaveTextContent("Credit ending in 4242");
    expect(screen.getByText("Expires 08/2029 · Lena Fischer")).toBeInTheDocument();
  });

  it("never shows more than the last four digits and no logo, only a text chip", () => {
    const { container } = render(<Card />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).not.toMatch(/\d{5,}/);
    expect(container.querySelector("[aria-hidden=true]")!.textContent).toContain("Credit");
  });

  it("falls back to the word Card when there is no brand", () => {
    render(<Card method={{ ...method, brand: undefined }} />);
    expect(screen.getByRole("group")).toHaveTextContent("Card ending in 4242");
  });

  it("marks the default method and hides Make default on it", () => {
    const { rerender } = render(<Card />);
    expect(screen.getByRole("button", { name: "Make default" })).toBeInTheDocument();
    expect(screen.queryByText("Default")).toBeNull();
    rerender(<Card method={{ ...method, isDefault: true }} />);
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make default" })).toBeNull();
  });

  describe("expiry", () => {
    it("says nothing for a card that is good for a while", () => {
      render(<Card />);
      expect(screen.queryByText(/Expires soon/)).toBeNull();
    });

    it("says Expires soon with an icon within the window, counted to the end of the month", () => {
      const { container, rerender } = render(<Card method={{ ...method, expMonth: 11, expYear: 2026 }} />);
      const notice = screen.getByText(/Expires soon, 11\/2026/);
      expect(notice.querySelector("svg")).not.toBeNull();
      expect(container).toBeTruthy();
      rerender(<Card method={{ ...method, expMonth: 10, expYear: 2026 }} />);
      expect(screen.getByText(/Expires soon, 10\/2026/)).toBeInTheDocument();
      rerender(<Card method={{ ...method, expMonth: 11, expYear: 2026 }} expiresSoonDays={10} />);
      expect(screen.queryByText(/Expires soon/)).toBeNull();
    });

    it("says Expired once the month is over", () => {
      render(<Card method={{ ...method, expMonth: 9, expYear: 2026 }} />);
      expect(screen.getByText("Expired on 09/2026. Update it to keep paying.")).toBeInTheDocument();
    });
  });

  it("runs Update and Make default with the method", async () => {
    const onUpdate = vi.fn();
    const onMakeDefault = vi.fn();
    const u = userEvent.setup();
    render(<Card onUpdate={onUpdate} onMakeDefault={onMakeDefault} />);
    await u.click(screen.getByRole("button", { name: "Update" }));
    expect(onUpdate).toHaveBeenCalledWith(method);
    await u.click(screen.getByRole("button", { name: "Make default" }));
    await waitFor(() => expect(onMakeDefault).toHaveBeenCalledWith(method));
    await waitFor(() => expect(screen.getByText("Default payment method changed to the one ending in 4242")).toBeInTheDocument());
  });

  it("asks before removing and removes only after the confirmation, then announces it", async () => {
    const onRemove = vi.fn();
    const u = userEvent.setup();
    render(<Card onRemove={onRemove} />);
    await u.click(screen.getByRole("button", { name: "Remove" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("ending in 4242 will be removed");
    await u.click(within(dialog).getByRole("button", { name: "Keep it" }));
    expect(onRemove).not.toHaveBeenCalled();
    await u.click(screen.getByRole("button", { name: "Remove" }));
    await u.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith(method));
    await waitFor(() => expect(screen.getByText("Payment method removed")).toBeInTheDocument());
  });

  it("warns when the removed method is the default", async () => {
    const u = userEvent.setup();
    render(<Card method={{ ...method, isDefault: true }} />);
    await u.click(screen.getByRole("button", { name: "Remove" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("is your default");
  });

  it("moves focus to the card after a removal so it is not lost", async () => {
    const u = userEvent.setup();
    function Host() {
      const [current, setCurrent] = useState<typeof method | undefined>(method);
      return <PaymentMethodCard method={current} onRemove={() => setCurrent(undefined)} onAdd={() => {}} />;
    }
    render(<Host />);
    await u.click(screen.getByRole("button", { name: "Remove" }));
    await u.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(screen.getByRole("group", { name: "Payment method" })).toHaveFocus());
    expect(screen.getByText("Payment method removed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a payment method" })).toBeInTheDocument();
  });

  describe("states", () => {
    it("offers Add a payment method when there is none", async () => {
      const onAdd = vi.fn();
      const u = userEvent.setup();
      render(<PaymentMethodCard onAdd={onAdd} />);
      expect(screen.getByText("No payment method yet")).toBeInTheDocument();
      await u.click(screen.getByRole("button", { name: "Add a payment method" }));
      expect(onAdd).toHaveBeenCalled();
    });

    it("shows loading, and an error with a retry", async () => {
      const onRetry = vi.fn();
      const u = userEvent.setup();
      const { container, rerender } = render(<PaymentMethodCard state="loading" />);
      expect(container.querySelector("[aria-busy=true]")).not.toBeNull();
      rerender(<PaymentMethodCard state="error" onRetry={onRetry} />);
      await u.click(screen.getByRole("button", { name: "Try again" }));
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe("permissions", () => {
    it("keeps disabled actions reachable with their reason and runs nothing", async () => {
      const onRemove = vi.fn();
      const onUpdate = vi.fn();
      const u = userEvent.setup();
      render(
        <Card
          onRemove={onRemove}
          onUpdate={onUpdate}
          permissions={{ remove: { state: "disabled", reason: "Keep one method." }, update: { state: "disabled", reason: "Owners only." } }}
        />,
      );
      const remove = screen.getByRole("button", { name: "Remove" });
      expect(remove).toHaveAttribute("aria-disabled", "true");
      expect(remove).toHaveAccessibleDescription("Keep one method.");
      await u.click(remove);
      await u.click(screen.getByRole("button", { name: "Update" }));
      expect(screen.queryByRole("alertdialog")).toBeNull();
      expect(onRemove).not.toHaveBeenCalled();
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("leaves hidden actions out, and the add button of the empty state", () => {
      const { rerender } = render(<Card permissions={{ makeDefault: "hidden" }} />);
      expect(screen.queryByRole("button", { name: "Make default" })).toBeNull();
      rerender(<PaymentMethodCard onAdd={() => {}} permissions={{ add: "hidden" }} />);
      expect(screen.queryByRole("button", { name: "Add a payment method" })).toBeNull();
    });
  });

  it("puts a class name on every part", () => {
    const names = ["root", "brand", "details", "number", "expiry", "badge", "notice", "actions", "updateButton", "removeButton", "defaultButton", "status"] as const;
    const classNames = Object.fromEntries(names.map((n) => [n, `c-${n}`]));
    const { container, rerender } = render(<Card method={{ ...method, isDefault: true, expMonth: 11, expYear: 2026 }} classNames={classNames} />);
    rerender(<Card method={{ ...method, expMonth: 11, expYear: 2026 }} classNames={classNames} />);
    for (const n of names.filter((n) => n !== "badge")) expect(container.querySelector(`.c-${n}`), n).not.toBeNull();
    rerender(<Card method={{ ...method, isDefault: true }} classNames={classNames} />);
    expect(container.querySelector(".c-badge")).not.toBeNull();
    rerender(<PaymentMethodCard onAdd={() => {}} classNames={{ addButton: "c-add" }} />);
    expect(container.querySelector(".c-add")).not.toBeNull();
  });

  it("has no axe violations in each state, expiring and with the dialog open", async () => {
    for (const props of [{}, { method: { ...method, expMonth: 11, expYear: 2026, isDefault: true } }, { method: { ...method, expMonth: 9, expYear: 2026 } }, { method: undefined }, { state: "loading" as const }, { state: "error" as const }]) {
      const { container, unmount } = render(<Card onAdd={() => {}} onRetry={() => {}} {...props} />);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
    const u = userEvent.setup();
    render(<Card />);
    await u.click(screen.getByRole("button", { name: "Remove" }));
    expect(await axeViolations(await screen.findByRole("alertdialog"))).toEqual([]);
  });

  it("renders on the server", () => {
    expect(renderToString(<Card />)).toContain("4242");
    expect(renderToString(<PaymentMethodCard onAdd={() => {}} />)).toContain("Add a payment method");
  });
});
