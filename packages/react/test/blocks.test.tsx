import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustomerTable } from "../src/customer-table/customer-table";
import type { Customer } from "../src/customer-table/query";
import { DashboardShell } from "../src/dashboard-shell/dashboard-shell";
import { Sidebar } from "../src/sidebar/sidebar";
import { navPermission, visibleNav, type NavGroup } from "../src/sidebar/nav";
import { HomeIcon } from "../src/utils/icons";
import { axeViolations } from "./axe";

async function tabTo(element: HTMLElement) {
  for (let i = 0; i < 40 && document.activeElement !== element; i++) await userEvent.tab();
  expect(element).toHaveFocus();
}

const customers: Customer[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com", plan: "Pro", status: "active", mrr: 99, joinedAt: "2026-01-14" },
  { id: "2", name: "Grace Hopper", email: "grace@example.com", plan: "Team", status: "trial", mrr: 49, joinedAt: "2026-02-02" },
];

describe("navigation permissions (pure)", () => {
  const groups: NavGroup[] = [
    { label: "A", items: [{ id: "a1", label: "One" }, { id: "a2", label: "Two", permission: "hidden" }] },
    { label: "B", items: [{ id: "b1", label: "Three", permission: "hidden" }] },
    {
      label: "C",
      items: [
        { id: "c1", label: "Parent", children: [{ id: "c1a", label: "Kid", permission: false }, { id: "c1b", label: "Gone", permission: "hidden" }] },
        { id: "c2", label: "Empty parent", children: [{ id: "c2a", label: "Gone", permission: "hidden" }] },
      ],
    },
  ];

  it("drops hidden items, empty groups and parents with no visible children, and keeps disabled ones", () => {
    const visible = visibleNav(groups);
    expect(visible.map((g) => g.label)).toEqual(["A", "C"]);
    expect(visible[0].items.map((i) => i.id)).toEqual(["a1"]);
    expect(visible[1].items.map((i) => i.id)).toEqual(["c1"]);
    expect(visible[1].items[0].children?.map((c) => c.id)).toEqual(["c1a"]);
  });

  it("does not change what it was given", () => {
    visibleNav(groups);
    expect(groups[2].items[0].children).toHaveLength(2);
  });

  it("reads an item permission", () => {
    expect(navPermission({ id: "x", label: "X" }).isAllowed).toBe(true);
    expect(navPermission({ id: "x", label: "X", permission: { state: "disabled", reason: "No" } })).toMatchObject({ isDisabled: true, reason: "No" });
  });
});

const permNav: NavGroup[] = [
  {
    label: "Work",
    items: [
      { id: "home", label: "Home", href: "/" },
      { id: "billing", label: "Billing", permission: "hidden" },
      { id: "reports", label: "Reports", permission: { state: "disabled", reason: "Part of the Team plan" } },
    ],
  },
  { label: "Admin", items: [{ id: "keys", label: "Keys", permission: "hidden" }] },
];

describe("Sidebar permissions", () => {
  it("does not render hidden items or groups left empty", () => {
    render(<Sidebar navigation={permNav} brand="Acme" />);
    expect(screen.queryByText("Billing")).not.toBeInTheDocument();
    expect(screen.queryByText("Keys")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
  });

  it("keeps a disabled item focusable, explained and unable to navigate", async () => {
    const onNavigate = vi.fn();
    render(<Sidebar navigation={permNav} brand="Acme" onNavigate={onNavigate} />);
    const item = screen.getByRole("button", { name: /Reports/ });
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item).not.toBeDisabled();
    expect(item).toHaveAccessibleDescription("Part of the Team plan");
    await tabTo(item);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Part of the Team plan");
    await userEvent.keyboard("{Enter}");
    await userEvent.click(item);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("has no axe violations with hidden and disabled items", async () => {
    const { container } = render(<Sidebar navigation={permNav} brand="Acme" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("DashboardShell permissions", () => {
  it("applies the same rules", () => {
    render(
      <DashboardShell navigation={permNav} brand="Acme">
        Page
      </DashboardShell>,
    );
    expect(screen.queryByText("Billing")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reports/ })).toHaveAttribute("aria-disabled", "true");
  });
});

const sidebarSlots = ["root", "header", "team-switcher", "search", "nav", "group", "item", "sub-list", "footer", "collapse", "account"] as const;
const shellSlots = ["root", "skip-link", "sidebar", "collapse", "nav", "group", "item", "sub-list", "account", "header", "search", "actions", "main", "menu-sheet", "team-switcher"] as const;
const slotNav: NavGroup[] = [
  {
    label: "G",
    items: [
      { id: "a", label: "Alpha", icon: <HomeIcon />, href: "/" },
      { id: "p", label: "Parent", children: [{ id: "c", label: "Child", href: "/c" }] },
    ],
  },
];
const cls = (slot: string) => `x-${slot}`;
const classes = (slots: readonly string[]) => Object.fromEntries(slots.map((s) => [s, cls(s)]));

describe("classNames", () => {
  it("Sidebar gives every slot its class", () => {
    const { container } = render(
      <Sidebar
        navigation={slotNav}
        currentId="a"
        team={{ name: "Acme" }}
        teams={[{ name: "Acme" }, { name: "Beta" }]}
        user={{ name: "Ada", menu: [{ id: "o", label: "Out", onSelect: () => {} }] }}
        onSearch={() => {}}
        footer={<span>Footer</span>}
        classNames={classes(sidebarSlots)}
      />,
    );
    for (const slot of sidebarSlots) expect(container.querySelector(`.${cls(slot)}`), slot).not.toBeNull();
  });

  it("DashboardShell gives every slot its class", async () => {
    const { container } = render(
      <DashboardShell
        navigation={slotNav}
        currentId="a"
        team={{ name: "Acme" }}
        teams={[{ name: "Acme" }, { name: "Beta" }]}
        user={{ name: "Ada", menu: [{ id: "o", label: "Out", onSelect: () => {} }] }}
        onSearch={() => {}}
        actions={<button type="button">Act</button>}
        classNames={classes(shellSlots)}
      >
        Page
      </DashboardShell>,
    );
    for (const slot of shellSlots.filter((s) => s !== "menu-sheet")) expect(container.querySelector(`.${cls(slot)}`), slot).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(document.querySelector(`.${cls("menu-sheet")}`)).not.toBeNull();
  });

  it("CustomerTable gives every slot its class", () => {
    const slots = ["root", "insights", "stat", "chart", "toolbar", "search", "filters", "export", "table", "cards", "empty", "error", "footer", "pagination"] as const;
    const many: Customer[] = Array.from({ length: 25 }, (_, i) => ({ id: `c${i}`, name: `P ${i}`, email: `p${i}@x.io`, plan: "Pro", status: "active", mrr: 5, joinedAt: "2026-01-01" }));
    const { container, rerender } = render(<CustomerTable customers={many} classNames={classes(slots)} />);
    for (const slot of slots.filter((s) => s !== "empty" && s !== "error")) expect(container.querySelector(`.${cls(slot)}`), slot).not.toBeNull();
    rerender(<CustomerTable customers={[]} classNames={classes(slots)} />);
    expect(container.querySelector(`.${cls("empty")}`)).not.toBeNull();
    rerender(<CustomerTable customers={many} error="Down" classNames={classes(slots)} />);
    expect(container.querySelector(`.${cls("error")}`)).not.toBeNull();
  });
});

describe("CustomerTable permissions", () => {
  it("removes Export when hidden", () => {
    render(<CustomerTable customers={customers} insights="none" permissions={{ export: "hidden" }} />);
    expect(screen.queryByRole("button", { name: "Export CSV" })).not.toBeInTheDocument();
  });

  it("keeps a disabled Export focusable, explained and inert", async () => {
    const onExport = vi.fn();
    render(<CustomerTable customers={customers} insights="none" onExport={onExport} permissions={{ export: { state: "disabled", reason: "Admins only" } }} />);
    const button = screen.getByRole("button", { name: "Export CSV" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAccessibleDescription("Admins only");
    await tabTo(button);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Admins only");
    await userEvent.keyboard("{Enter}");
    await userEvent.click(button);
    expect(onExport).not.toHaveBeenCalled();
  });

  it("exports normally when allowed", async () => {
    const onExport = vi.fn();
    render(<CustomerTable customers={customers} insights="none" onExport={onExport} permissions={{ export: true }} />);
    await userEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("makes names plain text when open is hidden, and a described disabled button when it is disabled", () => {
    const { unmount } = render(<CustomerTable customers={customers} insights="none" onSelect={() => {}} permissions={{ open: "hidden" }} />);
    expect(screen.queryByRole("button", { name: "Ada Lovelace" })).not.toBeInTheDocument();
    unmount();
    render(<CustomerTable customers={customers} insights="none" onSelect={() => {}} permissions={{ open: { state: "disabled", reason: "Ask an admin" } }} />);
    expect(screen.getAllByRole("button", { name: "Ada Lovelace" })[0]).toHaveAttribute("aria-disabled", "true");
  });

  it("has no axe violations with a disabled export", async () => {
    const { container } = render(<CustomerTable customers={customers} insights="none" permissions={{ export: { state: "disabled", reason: "Admins only" }, open: false }} onSelect={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("CustomerTable events", () => {
  it("fires onSelect together with onOpenCustomer", async () => {
    const onSelect = vi.fn();
    const onOpenCustomer = vi.fn();
    render(<CustomerTable customers={customers} insights="none" onSelect={onSelect} onOpenCustomer={onOpenCustomer} />);
    await userEvent.click(screen.getAllByRole("button", { name: "Ada Lovelace" })[0]);
    expect(onSelect).toHaveBeenCalledWith(customers[0]);
    expect(onOpenCustomer).toHaveBeenCalledWith(customers[0]);
  });

  it("still opens with onOpenCustomer alone", async () => {
    const onOpenCustomer = vi.fn();
    render(<CustomerTable customers={customers} insights="none" onOpenCustomer={onOpenCustomer} />);
    await userEvent.click(screen.getAllByRole("button", { name: "Grace Hopper" })[0]);
    expect(onOpenCustomer).toHaveBeenCalledWith(customers[1]);
  });

  it("fires onSearch with the text, and onFilter when filters change or clear", async () => {
    const onSearch = vi.fn();
    const onFilter = vi.fn();
    render(<CustomerTable customers={customers} insights="none" onSearch={onSearch} onFilter={onFilter} defaultQuery={{ status: ["active"] }} />);
    await userEvent.type(screen.getByRole("searchbox"), "ad");
    expect(onSearch).toHaveBeenLastCalledWith("ad");
    expect(onFilter).not.toHaveBeenCalled();
    await userEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
    expect(onFilter).toHaveBeenCalledWith({ status: [], plan: [] });
    expect(onSearch).toHaveBeenLastCalledWith("");
  });

  it("fires onQueryChange as before alongside onSearch on a server list", async () => {
    const onQueryChange = vi.fn();
    const onSearch = vi.fn();
    render(<CustomerTable customers={customers} insights="none" serverSide onQueryChange={onQueryChange} onSearch={onSearch} />);
    await userEvent.type(screen.getByRole("searchbox"), "g");
    await vi.waitFor(() => expect(onSearch).toHaveBeenCalledWith("g"));
    expect(onQueryChange).toHaveBeenCalledWith(expect.objectContaining({ search: "g" }));
  });
});
