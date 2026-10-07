import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { UsageMeter, UsageMeterList } from "../src";
import { axeViolations } from "./axe";

describe("UsageMeter", () => {
  it("is a meter named by its label with the numbers and words as its value", () => {
    render(<UsageMeter label="Seats" value={6} limit={10} unit="seats" />);
    const meter = screen.getByRole("meter", { name: "Seats" });
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "10");
    expect(meter).toHaveAttribute("aria-valuenow", "6");
    expect(meter).toHaveAttribute("aria-valuetext", "6 of 10 seats");
    expect(screen.getByText("6 of 10 seats")).toBeInTheDocument();
    expect(screen.queryByText("Near the limit")).toBeNull();
  });

  it("formats decimals and takes a custom formatter", () => {
    const { rerender } = render(<UsageMeter label="Storage" value={4.2} limit={5} unit="GB" />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", "4.2 of 5 GB, near the limit");
    rerender(<UsageMeter label="Storage" value={2048} limit={5120} formatValue={(n) => `${n / 1024} GB`} />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", "2 GB of 5 GB");
  });

  it("warns at 80 percent with words and an icon", () => {
    const { container } = render(<UsageMeter label="Seats" value={8} limit={10} />);
    const text = screen.getByText("Near the limit");
    expect(text.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("[role=meter] > div")!.className).toContain("feedback-warning");
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", expect.stringContaining("near the limit"));
  });

  it("says Limit reached at 100 percent and Over the limit above it, with a full bar", () => {
    const { container, rerender } = render(<UsageMeter label="Seats" value={10} limit={10} />);
    expect(screen.getByText("Limit reached")).toBeInTheDocument();
    expect(container.querySelector("[role=meter] > div")!.className).toContain("feedback-danger");
    rerender(<UsageMeter label="Seats" value={12} limit={10} />);
    expect(screen.getByText("Over the limit")).toBeInTheDocument();
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "10");
    expect(meter).toHaveAttribute("aria-valuetext", expect.stringContaining("over the limit"));
    expect((container.querySelector("[role=meter] > div") as HTMLElement).style.width).toBe("100%");
  });

  it("uses your own thresholds", () => {
    render(<UsageMeter label="Seats" value={5} limit={10} warningAt={50} />);
    expect(screen.getByText("Near the limit")).toBeInTheDocument();
  });

  it("offers the upgrade only near the limit, and runs it", async () => {
    const onUpgrade = vi.fn();
    const u = userEvent.setup();
    const { rerender } = render(<UsageMeter label="Seats" value={5} limit={10} onUpgrade={onUpgrade} />);
    expect(screen.queryByRole("button", { name: "Upgrade" })).toBeNull();
    rerender(<UsageMeter label="Seats" value={9} limit={10} onUpgrade={onUpgrade} upgradeLabel="Add seats" />);
    await u.click(screen.getByRole("button", { name: "Add seats" }));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it("reaches the upgrade button with Tab and runs it with Enter", async () => {
    const onUpgrade = vi.fn();
    const u = userEvent.setup();
    render(<UsageMeter label="Seats" value={10} limit={10} onUpgrade={onUpgrade} />);
    await u.tab();
    expect(screen.getByRole("button", { name: "Upgrade" })).toHaveFocus();
    await u.keyboard("{Enter}");
    await waitFor(() => expect(onUpgrade).toHaveBeenCalled());
  });

  describe("permissions", () => {
    it("keeps a disabled upgrade reachable with the reason as its description and runs nothing", async () => {
      const onUpgrade = vi.fn();
      const u = userEvent.setup();
      render(<UsageMeter label="Seats" value={10} limit={10} onUpgrade={onUpgrade} permissions={{ upgrade: { state: "disabled", reason: "Ask a billing owner." } }} />);
      const button = screen.getByRole("button", { name: "Upgrade" });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAccessibleDescription("Ask a billing owner.");
      await u.click(button);
      expect(onUpgrade).not.toHaveBeenCalled();
    });

    it("leaves the upgrade out when hidden", () => {
      render(<UsageMeter label="Seats" value={10} limit={10} onUpgrade={() => {}} permissions={{ upgrade: "hidden" }} />);
      expect(screen.queryByRole("button")).toBeNull();
    });
  });

  it("shows a skeleton while loading and marks itself busy", () => {
    render(<UsageMeter label="Seats" value={0} limit={10} state="loading" />);
    expect(screen.getByRole("group", { name: "Loading Seats" })).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("meter")).toBeNull();
  });

  it("puts a class name on every part", () => {
    const names = ["root", "header", "label", "value", "status", "track", "bar", "description", "upgradeButton"] as const;
    const classNames = Object.fromEntries(names.map((n) => [n, `c-${n}`]));
    const { container } = render(<UsageMeter label="Seats" value={10} limit={10} description="Resets monthly" onUpgrade={() => {}} classNames={classNames} />);
    for (const n of names) expect(container.querySelector(`.c-${n}`), n).not.toBeNull();
  });

  it("has no axe violations in each level and while loading", async () => {
    for (const value of [3, 8, 10, 12]) {
      const { container, unmount } = render(<UsageMeter label="Seats" value={value} limit={10} unit="seats" description="Resets monthly" onUpgrade={() => {}} />);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
    const { container } = render(<UsageMeter label="Seats" value={0} limit={10} state="loading" />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders on the server", () => {
    expect(renderToString(<UsageMeter label="Seats" value={6} limit={10} />)).toContain('role="meter"');
  });
});

describe("UsageMeterList", () => {
  const meters = [
    { label: "Seats", value: 6, limit: 10 },
    { label: "Storage", value: 5, limit: 5 },
  ];

  it("lists the meters in a named list", () => {
    render(<UsageMeterList label="Usage this period" meters={meters} />);
    const list = screen.getByRole("list", { name: "Usage this period" });
    expect(list.querySelectorAll("li")).toHaveLength(2);
    expect(screen.getAllByRole("meter")).toHaveLength(2);
  });

  it("shows loading, empty and error states, with a retry", async () => {
    const onRetry = vi.fn();
    const u = userEvent.setup();
    const { container, rerender } = render(<UsageMeterList meters={[]} state="loading" />);
    expect(container.querySelector("[aria-busy=true]")).not.toBeNull();
    rerender(<UsageMeterList meters={[]} />);
    expect(screen.getByText("No usage to show yet")).toBeInTheDocument();
    rerender(<UsageMeterList meters={[]} state="error" onRetry={onRetry} />);
    await u.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("takes class names and has no axe violations", async () => {
    const { container } = render(<UsageMeterList meters={meters} classNames={{ root: "c-root", item: "c-item" }} />);
    expect(container.querySelector(".c-root")).not.toBeNull();
    expect(container.querySelector(".c-item")).not.toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });
});
