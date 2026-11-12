import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { BottomNav, HomeIcon, InboxIcon, UserIcon, type NavItem } from "../src";
import { axeViolations } from "./axe";

const items: NavItem[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "inbox", label: "Inbox", icon: <InboxIcon />, badge: 3 },
  { id: "account", label: "Account", icon: <UserIcon /> },
];

describe("BottomNav", () => {
  it("is one named navigation landmark holding a list of tabs", () => {
    render(<BottomNav items={items} currentId="home" />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(nav).getAllByRole("listitem")).toHaveLength(3);
    expect(within(nav).getAllByRole("button")).toHaveLength(3);
  });

  it("takes a custom landmark name", () => {
    render(<BottomNav items={items} label="App tabs" />);
    expect(screen.getByRole("navigation", { name: "App tabs" })).toBeInTheDocument();
  });

  it("marks only the current tab with aria-current", () => {
    render(<BottomNav items={items} currentId="inbox" />);
    expect(screen.getByRole("button", { name: /Inbox/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: /Home/ })).not.toHaveAttribute("aria-current");
  });

  it("calls onNavigate with the item on click and on Enter and Space", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<BottomNav items={items} onNavigate={onNavigate} />);
    await user.click(screen.getByRole("button", { name: "Home" }));
    expect(onNavigate).toHaveBeenLastCalledWith(expect.objectContaining({ id: "home" }));
    screen.getByRole("button", { name: "Account" }).focus();
    await user.keyboard("{Enter}");
    expect(onNavigate).toHaveBeenLastCalledWith(expect.objectContaining({ id: "account" }));
    await user.keyboard(" ");
    expect(onNavigate).toHaveBeenCalledTimes(3);
  });

  it("moves through the tabs in order with Tab", async () => {
    const user = userEvent.setup();
    render(<BottomNav items={items} />);
    await user.tab();
    expect(screen.getByRole("button", { name: "Home" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: /Inbox/ })).toHaveFocus();
  });

  it("draws items with an href as links", () => {
    render(<BottomNav items={[{ id: "home", label: "Home", href: "/" }]} currentId="home" />);
    const link = screen.getByRole("link", { name: "Home" });
    expect(link).toHaveAttribute("href", "/");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("reads a count after the label", () => {
    render(<BottomNav items={items} />);
    const inbox = screen.getByRole("button", { name: /Inbox/ });
    expect(inbox.textContent).toContain("3");
    expect(within(inbox).getByText(", 3")).toHaveClass("sr-only");
  });

  it("shows a letter when an item has no icon", () => {
    render(<BottomNav items={[{ id: "a", label: "Library" }]} />);
    expect(screen.getByText("L")).toBeInTheDocument();
  });

  it("drops sub-items: a tab bar is one level", () => {
    render(<BottomNav items={[{ id: "a", label: "More", children: [{ id: "b", label: "Hidden child" }] }]} />);
    expect(screen.queryByText("Hidden child")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  describe("labels", () => {
    it("shows every label by default", () => {
      render(<BottomNav items={items} />);
      expect(screen.getByText("Home")).not.toHaveClass("sr-only");
      expect(screen.getByText("Account")).not.toHaveClass("sr-only");
    });
    it("shows only the current label with labels=active, and the others keep their names", () => {
      render(<BottomNav items={items} currentId="home" labels="active" />);
      expect(screen.getByText("Home")).not.toHaveClass("sr-only");
      expect(screen.getByText("Account")).toHaveClass("sr-only");
      expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
    });
    it("hides every label visually with labels=never but keeps the names", () => {
      render(<BottomNav items={items} currentId="home" labels="never" />);
      for (const name of ["Home", "Account"]) {
        expect(screen.getByText(name)).toHaveClass("sr-only");
        expect(screen.getByRole("button", { name })).toBeInTheDocument();
      }
    });
  });

  describe("permissions", () => {
    it("does not draw a hidden tab", () => {
      render(<BottomNav items={[...items, { id: "admin", label: "Admin", permission: "hidden" }]} />);
      expect(screen.queryByRole("button", { name: "Admin" })).not.toBeInTheDocument();
    });
    it("keeps a disabled tab focusable, goes nowhere and says why", async () => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(<BottomNav items={[{ id: "inbox", label: "Inbox", permission: { state: "disabled", reason: "Verify your email" } }]} onNavigate={onNavigate} />);
      const tab = screen.getByRole("button", { name: "Inbox" });
      expect(tab).toHaveAttribute("aria-disabled", "true");
      expect(tab).toHaveAccessibleDescription("Verify your email");
      await user.click(tab);
      expect(onNavigate).not.toHaveBeenCalled();
    });
    it("treats false as disabled without a reason", () => {
      render(<BottomNav items={[{ id: "a", label: "A", permission: false }]} />);
      expect(screen.getByRole("button", { name: "A" })).toHaveAttribute("aria-disabled", "true");
    });
  });

  it("draws the tabs with your router's link", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(
      <BottomNav
        items={[{ id: "home", label: "Home", href: "/" }]}
        currentId="home"
        onNavigate={onNavigate}
        renderLink={({ item, className, children, isCurrent, onClick }) => (
          <a
            data-router
            href={item.href}
            className={className}
            aria-current={isCurrent ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              onClick();
            }}
          >
            {children}
          </a>
        )}
      />,
    );
    const link = screen.getByRole("link", { name: "Home" });
    expect(link).toHaveAttribute("data-router");
    expect(link).toHaveAttribute("aria-current", "page");
    await user.click(link);
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: "home" }));
  });

  it("works as a controlled bar that follows the choice", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [current, setCurrent] = useState("home");
      return <BottomNav items={items} currentId={current} onNavigate={(i) => setCurrent(i.id)} />;
    }
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Account" }));
    expect(screen.getByRole("button", { name: "Account" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("pins itself to the bottom only when asked, and keeps clear of the home indicator", () => {
    const { rerender } = render(<BottomNav items={items} />);
    const nav = screen.getByRole("navigation");
    expect(nav).not.toHaveClass("fixed");
    expect(nav.className).toContain("safe-area-inset-bottom");
    rerender(<BottomNav items={items} fixed />);
    expect(nav).toHaveClass("fixed", "bottom-0");
  });

  it("sizes every tab for touch", () => {
    render(<BottomNav items={items} />);
    for (const tab of screen.getAllByRole("button")) expect(tab.className).toContain("min-h-12");
  });

  it("adds className and slot classNames after the built-in ones, and forwards the ref", () => {
    const ref = { current: null as HTMLElement | null };
    render(<BottomNav ref={ref} items={items} currentId="home" className="own" classNames={{ root: "r", list: "l", item: "i", icon: "ic", label: "lb", badge: "bd" }} />);
    const nav = screen.getByRole("navigation");
    expect(ref.current).toBe(nav);
    expect(nav).toHaveClass("own", "r");
    expect(nav.querySelector("ul")).toHaveClass("l");
    expect(screen.getByRole("button", { name: /Inbox/ })).toHaveClass("i");
    expect(nav.querySelector(".ic")).not.toBeNull();
    expect(nav.querySelector(".lb")).not.toBeNull();
    expect(nav.querySelector(".bd")).not.toBeNull();
  });

  it("has no accessibility violations in any variant", async () => {
    const all = [...items, { id: "x", label: "Locked", permission: { state: "disabled" as const, reason: "No access" } }];
    for (const props of [{}, { variant: "floating" as const }, { labels: "active" as const }, { labels: "never" as const }, { fixed: true }]) {
      const { container, unmount } = render(<BottomNav items={all} currentId="inbox" {...props} />);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });
});
