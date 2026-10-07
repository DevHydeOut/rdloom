import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "../src/sidebar/sidebar";
import type { NavGroup } from "../src/sidebar/nav";
import { HomeIcon, UsersIcon } from "../src/utils/icons";
import { axeViolations } from "./axe";

const navigation: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { id: "home", label: "Home", icon: <HomeIcon />, href: "/" },
      { id: "customers", label: "Customers", icon: <UsersIcon />, badge: 24, href: "/customers" },
      {
        id: "reports",
        label: "Reports",
        children: [
          { id: "revenue", label: "Revenue", href: "/reports/revenue" },
          { id: "retention", label: "Retention", href: "/reports/retention" },
        ],
      },
    ],
  },
];

const user = { name: "Ada Lovelace", email: "ada@example.com", menu: [{ id: "out", label: "Sign out", onSelect: vi.fn() }] };

describe("Sidebar", () => {
  it("is a named navigation landmark and marks the current page", () => {
    render(<Sidebar navigation={navigation} currentId="customers" brand="Acme" />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(nav).getByRole("link", { name: /Customers/ })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: /Home/ })).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Acme")).toBeInTheDocument();
  });

  it("reads a badge after the label", () => {
    render(<Sidebar navigation={navigation} brand="Acme" />);
    expect(screen.getByRole("link", { name: /Customers\s*,\s*24/ })).toBeInTheDocument();
  });

  it("opens the list that holds the current page", () => {
    render(<Sidebar navigation={navigation} currentId="retention" brand="Acme" />);
    expect(screen.getByRole("button", { name: /Reports/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Retention" })).toHaveAttribute("aria-current", "page");
  });

  it("calls onNavigate and onPick when an item is chosen", async () => {
    const onNavigate = vi.fn();
    const onPick = vi.fn();
    const nav: NavGroup[] = [{ items: [{ id: "a", label: "Alpha" }] }];
    render(<Sidebar navigation={nav} brand="Acme" onNavigate={onNavigate} onPick={onPick} />);
    await userEvent.click(screen.getByRole("button", { name: "Alpha" }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it("folds with the Collapse button and says what the button will do", async () => {
    const onCollapsedChange = vi.fn();
    render(<Sidebar navigation={navigation} brand="Acme" onCollapsedChange={onCollapsedChange} />);
    const button = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(button).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(button);
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    const open = screen.getByRole("button", { name: "Expand sidebar" });
    expect(open).toHaveAttribute("aria-expanded", "false");
    // Names stay for assistive technology while folded.
    expect(screen.getByRole("link", { name: /Customers\s*,\s*24/ })).toBeInTheDocument();
  });

  it("can be controlled, and has no Collapse button when collapsible is off", () => {
    const { rerender } = render(<Sidebar navigation={navigation} brand="Acme" isCollapsed />);
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    rerender(<Sidebar navigation={navigation} brand="Acme" isCollapsed={false} collapsible={false} />);
    expect(screen.queryByRole("button", { name: /sidebar/ })).toBeNull();
  });

  it("starts folded with defaultCollapsed", () => {
    const { container } = render(<Sidebar navigation={navigation} brand="Acme" defaultCollapsed />);
    expect(container.firstElementChild).toHaveAttribute("data-collapsed", "true");
  });

  it("shows the footer only while open", async () => {
    render(<Sidebar navigation={navigation} brand="Acme" footer={<p>Free plan</p>} />);
    expect(screen.getByText("Free plan")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.queryByText("Free plan")).toBeNull();
  });

  it("shows a search button that calls onSearch", async () => {
    const onSearch = vi.fn();
    render(<Sidebar navigation={navigation} brand="Acme" onSearch={onSearch} searchLabel="Find" />);
    await userEvent.click(screen.getByRole("button", { name: "Find" }));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("switches workspace from a menu named with the current one", async () => {
    const onTeamChange = vi.fn();
    const teams = [{ id: "a", name: "Acme Inc" }, { id: "b", name: "Beta Ltd" }];
    render(<Sidebar navigation={navigation} team={teams[0]} teams={teams} onTeamChange={onTeamChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Switch workspace, current: Acme Inc" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Beta Ltd" }));
    expect(onTeamChange).toHaveBeenCalledWith(teams[1]);
  });

  it("has an account menu named with the person", async () => {
    render(<Sidebar navigation={navigation} brand="Acme" user={user} />);
    await userEvent.click(screen.getByRole("button", { name: "Account menu, Ada Lovelace" }));
    expect(await screen.findByRole("menuitem", { name: "Sign out" })).toBeInTheDocument();
  });

  it("applies the appearance", () => {
    const { container, rerender } = render(<Sidebar navigation={navigation} brand="Acme" appearance="floating" />);
    expect(container.firstElementChild).toHaveAttribute("data-appearance", "floating");
    rerender(<Sidebar navigation={navigation} brand="Acme" appearance="subtle" />);
    expect(container.firstElementChild).toHaveAttribute("data-appearance", "subtle");
  });

  it("draws items through renderLink", () => {
    render(
      <Sidebar
        navigation={navigation}
        brand="Acme"
        renderLink={({ item, className, children, isCurrent }) => (
          <a href={item.href} className={className} data-router data-current={isCurrent || undefined}>
            {children}
          </a>
        )}
      />,
    );
    expect(document.querySelectorAll("a[data-router]").length).toBeGreaterThan(0);
  });

  it("renders on the server", () => {
    expect(renderToString(<Sidebar navigation={navigation} currentId="home" brand="Acme" user={user} />)).toContain("Main navigation");
  });

  it("has no axe violations: open, folded, floating, with everything", async () => {
    const { container, rerender } = render(<Sidebar navigation={navigation} currentId="customers" brand="Acme" onSearch={() => {}} footer={<p>Free plan</p>} user={user} />);
    expect(await axeViolations(container)).toEqual([]);
    rerender(<Sidebar navigation={navigation} currentId="customers" brand="Acme" onSearch={() => {}} user={user} isCollapsed />);
    expect(await axeViolations(container)).toEqual([]);
    rerender(<Sidebar navigation={navigation} currentId="customers" brand="Acme" appearance="floating" />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("works controlled from a parent", async () => {
    function Host() {
      const [collapsed, setCollapsed] = useState(false);
      return <Sidebar navigation={navigation} brand="Acme" isCollapsed={collapsed} onCollapsedChange={setCollapsed} />;
    }
    render(<Host />);
    await userEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
  });
});
