import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "../src/dashboard-page/dashboard-page";
import { DashboardShell } from "../src/dashboard-shell/dashboard-shell";
import { badgeText, currentTopLevel, findNavItem, flattenNav, initialOf, trailOf, type NavGroup } from "../src/dashboard-shell/nav";
import { HomeIcon, UsersIcon } from "../src/utils/icons";
import { axeViolations } from "./axe";

const navigation: NavGroup[] = [
  {
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
  { label: "Account", items: [{ id: "settings", label: "Settings" }] },
];

const user = { name: "Ada Lovelace", email: "ada@example.com", menu: [{ id: "profile", label: "Your profile", onSelect: vi.fn() }, { id: "out", label: "Sign out", onSelect: vi.fn(), variant: "danger" as const }] };

describe("navigation as data", () => {
  it("lists every item, sub-items included, and finds one by id", () => {
    expect(flattenNav(navigation).map((i) => i.id)).toEqual(["home", "customers", "reports", "revenue", "retention", "settings"]);
    expect(findNavItem(navigation, "retention")?.label).toBe("Retention");
    expect(findNavItem(navigation, "nope")).toBeUndefined();
    expect(findNavItem(navigation, undefined)).toBeUndefined();
  });

  it("knows which top-level item holds the current page, and the trail to it", () => {
    expect(currentTopLevel(navigation, "retention")?.id).toBe("reports");
    expect(currentTopLevel(navigation, "home")?.id).toBe("home");
    expect(currentTopLevel(navigation, "x")).toBeUndefined();
    expect(trailOf(navigation, "retention")).toEqual(["Reports", "Retention"]);
    expect(trailOf(navigation, "settings")).toEqual(["Settings"]);
    expect(trailOf(navigation, undefined)).toEqual([]);
  });

  it("makes a letter and a spoken badge", () => {
    expect(initialOf("  inbox")).toBe("I");
    expect(initialOf("")).toBe("?");
    expect(badgeText(3)).toBe("3");
    expect(badgeText("New")).toBe("New");
    expect(badgeText(undefined)).toBe("");
  });
});

describe("DashboardShell", () => {
  afterEach(() => vi.restoreAllMocks());

  const shell = (props: Partial<React.ComponentProps<typeof DashboardShell>> = {}) =>
    render(
      <DashboardShell navigation={navigation} currentId="customers" brand="Acme Cloud" user={user} {...props}>
        <p>The page</p>
      </DashboardShell>,
    );
  const sidebarNav = () => screen.getAllByRole("navigation", { name: "Main navigation" })[0];

  it("has one main landmark, one header, a named navigation, and puts the page in main", () => {
    shell();
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveTextContent("The page");
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(sidebarNav()).toBeInTheDocument();
  });

  it("has a skip link as the first stop, and it moves focus to the page", async () => {
    shell();
    await userEvent.tab();
    const skip = screen.getByRole("link", { name: "Skip to main content" });
    expect(skip).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("marks the current page, and only that one", () => {
    shell();
    const nav = within(sidebarNav());
    expect(nav.getByRole("link", { name: /Customers/ })).toHaveAttribute("aria-current", "page");
    expect(nav.getByRole("link", { name: /^Home/ })).not.toHaveAttribute("aria-current");
    expect(nav.getAllByRole("link").filter((l) => l.getAttribute("aria-current") === "page")).toHaveLength(1);
  });

  it("reads a badge after the label and draws it as a pill", () => {
    shell();
    const link = within(sidebarNav()).getByRole("link", { name: /Customers/ });
    expect(link).toHaveAccessibleName("Customers , 24");
    const pill = [...link.querySelectorAll("[aria-hidden=true]")].find((n) => n.textContent === "24");
    expect(pill).toBeTruthy();
  });

  it("turns a badge into a dot when the sidebar is folded, and still reads it", () => {
    shell({ isCollapsed: true });
    const link = within(sidebarNav()).getByRole("link", { name: /Customers/ });
    expect(link).toHaveAccessibleName("Customers , 24");
    expect([...link.querySelectorAll("[aria-hidden=true]")].some((n) => n.textContent === "24")).toBe(false);
  });

  it("shows a letter when an item has no icon, but none for a sub-item", async () => {
    shell({ currentId: "retention" });
    expect(within(sidebarNav()).getByRole("link", { name: "Retention" }).querySelector("[aria-hidden=true]")).toBeNull();
  });

  it("shows a letter when an item has no icon", () => {
    shell();
    expect(within(sidebarNav()).getByRole("button", { name: /Settings/ })).toHaveTextContent("S");
  });

  it("opens an item's sub-list with its button, and says whether it is open", async () => {
    shell();
    const reports = within(sidebarNav()).getByRole("button", { name: /Reports/ });
    expect(reports).toHaveAttribute("aria-expanded", "false");
    expect(within(sidebarNav()).queryByRole("link", { name: "Revenue" })).toBeNull();
    await userEvent.click(reports);
    expect(reports).toHaveAttribute("aria-expanded", "true");
    expect(within(sidebarNav()).getByRole("link", { name: "Revenue" })).toBeInTheDocument();
    await userEvent.click(reports);
    expect(reports).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the list that holds the current page, and marks the sub-item", () => {
    shell({ currentId: "retention" });
    const nav = within(sidebarNav());
    expect(nav.getByRole("button", { name: /Reports/ })).toHaveAttribute("aria-expanded", "true");
    expect(nav.getByRole("link", { name: "Retention" })).toHaveAttribute("aria-current", "page");
  });

  it("calls onNavigate for a link and for a button item", async () => {
    const onNavigate = vi.fn();
    shell({ onNavigate });
    await userEvent.click(within(sidebarNav()).getByRole("link", { name: /^Home/ }));
    expect(onNavigate).toHaveBeenLastCalledWith(expect.objectContaining({ id: "home" }));
    await userEvent.click(within(sidebarNav()).getByRole("button", { name: /Settings/ }));
    expect(onNavigate).toHaveBeenLastCalledWith(expect.objectContaining({ id: "settings" }));
  });

  it("draws items with your router's link when you give renderLink", async () => {
    const seen: Array<{ id: string; isCurrent: boolean }> = [];
    const onNavigate = vi.fn();
    shell({
      onNavigate,
      renderLink: ({ item, className, children, isCurrent, onClick }) => {
        seen.push({ id: item.id, isCurrent });
        return (
          <a href={item.href} data-router className={className} aria-current={isCurrent ? "page" : undefined} onClick={(e) => { e.preventDefault(); onClick(); }}>
            {children}
          </a>
        );
      },
    });
    const home = within(sidebarNav()).getByRole("link", { name: /^Home/ });
    expect(home).toHaveAttribute("data-router");
    expect(seen.find((s) => s.id === "customers")?.isCurrent).toBe(true);
    await userEvent.click(home);
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: "home" }));
  });

  it("folds down to icons and back, telling the person what the button will do", async () => {
    const onCollapsedChange = vi.fn();
    function Harness() {
      const [c, setC] = useState(false);
      return (
        <DashboardShell navigation={navigation} currentId="home" isCollapsed={c} onCollapsedChange={(v) => { setC(v); onCollapsedChange(v); }}>
          page
        </DashboardShell>
      );
    }
    const { container } = render(<Harness />);
    const button = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(button).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(button);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-expanded", "false");
    // every item keeps its name for assistive technology
    expect(within(sidebarNav()).getByRole("link", { name: /Customers/ })).toBeInTheDocument();
    expect(container.querySelector(".w-\\[4\\.5rem\\]")).not.toBeNull();
  });

  it("starts folded when asked, and opens the sidebar when a folded parent is pressed", async () => {
    const onCollapsedChange = vi.fn();
    shell({ defaultCollapsed: true, onCollapsedChange });
    await userEvent.click(within(sidebarNav()).getByRole("button", { name: /Reports/ }));
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
  });

  it("has an account menu named after the person, with working entries", async () => {
    shell();
    await userEvent.click(screen.getAllByRole("button", { name: "Account menu, Ada Lovelace" })[0]);
    await userEvent.click(await screen.findByRole("menuitem", { name: "Sign out" }));
    expect(user.menu[1].onSelect).toHaveBeenCalled();
  });

  it("shows a search button only when you handle it", async () => {
    const onSearch = vi.fn();
    const { rerender } = render(
      <DashboardShell navigation={navigation}>
        page
      </DashboardShell>,
    );
    expect(screen.queryByRole("button", { name: "Search" })).toBeNull();
    rerender(
      <DashboardShell navigation={navigation} onSearch={onSearch} searchLabel="Find anything" actions={<button>Create</button>}>
        page
      </DashboardShell>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Find anything" }));
    expect(onSearch).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("has the same navigation as a slide-in menu, which closes when you choose something", async () => {
    const onNavigate = vi.fn();
    shell({ onNavigate });
    await userEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("link", { name: /^Home/ }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: "home" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("folds to the phone layout when the space it is in is narrow, not only when the screen is", () => {
    let notify: (width: number) => void = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: (entries: Array<{ contentRect: { width: number } }>) => void) {
          notify = (width) => cb([{ contentRect: { width } }]);
        }
        observe() {}
        disconnect() {}
      },
    );
    const { container } = shell();
    const root = container.firstElementChild!;
    expect(root).not.toHaveAttribute("data-compact");
    act(() => notify(500));
    expect(root).toHaveAttribute("data-compact");
    act(() => notify(900));
    expect(root).not.toHaveAttribute("data-compact");
    vi.unstubAllGlobals();
  });

  it("renders on the server", () => {
    const html = renderToString(
      <DashboardShell navigation={navigation} currentId="home" brand="Acme">
        <p>Hi</p>
      </DashboardShell>,
    );
    expect(html).toContain("Skip to main content");
    expect(html).toContain('aria-current="page"');
  });

  it("has no axe violations: open, folded, with the phone menu open", async () => {
    const { container, rerender } = shell({ onSearch: () => {}, actions: <button>Create</button> });
    expect(await axeViolations(container)).toEqual([]);
    rerender(
      <DashboardShell navigation={navigation} currentId="retention" isCollapsed user={user}>
        page
      </DashboardShell>,
    );
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    await screen.findByRole("dialog");
    expect(await axeViolations(document.body)).toEqual([]);
  }, 30_000);
});

describe("DashboardPage", () => {
  it("has one h1 and shows the description and actions", () => {
    render(<DashboardPage title="Customers" description="Everyone on a plan." actions={<button>Export</button>} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Customers" })).toBeInTheDocument();
    expect(screen.getByText("Everyone on a plan.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("shows the key numbers as a labelled section that reads each as a sentence", () => {
    render(
      <DashboardPage
        title="Customers"
        stats={[{ label: "Monthly revenue", value: "$48,200", trend: { change: 12, label: "vs last month" } }, { label: "Trials", value: 36, description: "9 end this week" }]}
      >
        <p>Content</p>
      </DashboardPage>,
    );
    const section = screen.getByRole("region", { name: "Key numbers" });
    expect(within(section).getByText(/Monthly revenue: \$48,200\. Up 12%/)).toBeInTheDocument();
    expect(within(section).getByText(/Trials: 36\./)).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("leaves out the section when there are no numbers", () => {
    render(<DashboardPage title="Plain" />);
    expect(screen.queryByRole("region", { name: "Key numbers" })).toBeNull();
  });

  it("marks itself busy while loading, and the numbers become skeletons", () => {
    const { container } = render(<DashboardPage title="Customers" isLoading stats={[{ label: "Customers", value: 0 }]} />);
    expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading Customers")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<DashboardPage title="Customers" description="d" actions={<button>Add</button>} stats={[{ label: "A", value: 1 }, { label: "B", value: 2, trend: { change: -1 } }]} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
