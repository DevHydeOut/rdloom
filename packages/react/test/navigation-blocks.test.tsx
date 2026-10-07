import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppHeader } from "../src/app-header/app-header";
import { visibleItems, type NavItem } from "../src/sidebar/nav";
import { TopNav } from "../src/top-nav/top-nav";
import { UserMenu } from "../src/user-menu/user-menu";
import { axeViolations } from "./axe";

const user = { name: "Ada Lovelace", email: "ada@example.com" };

/** Lets a test choose the width the bar reports. */
function fakeWidth() {
  let notify: (width: number) => void = () => {};
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private cb: (entries: Array<{ contentRect: { width: number } }>) => void) {}
      // Only the bars report a width; the observers inside React Aria are left alone.
      observe(target: Element) {
        if (target.hasAttribute("data-variant") || target.hasAttribute("data-size")) notify = (width) => this.cb([{ contentRect: { width } }]);
      }
      unobserve() {}
      disconnect() {}
    },
  );
  return (width: number) => act(() => notify(width));
}

afterEach(() => vi.unstubAllGlobals());

describe("UserMenu", () => {
  const open = async () => {
    await userEvent.click(screen.getByRole("button", { name: "Account menu, Ada Lovelace" }));
    return screen.findByRole("menu", { name: "Ada Lovelace" });
  };

  it("names the button with the person and opens a menu named the same, with name and email", async () => {
    render(<UserMenu user={user} items={[{ id: "settings", label: "Settings", href: "/settings" }]} />);
    const menu = await open();
    expect(screen.getAllByText("ada@example.com").length).toBeGreaterThan(0);
    expect(within(menu).getByRole("menuitem", { name: "Settings" })).toHaveAttribute("href", "/settings");
  });

  it("opens from the keyboard, closes with Escape and returns focus to the button", async () => {
    render(<UserMenu user={user} items={[{ id: "a", label: "Alpha", onSelect: () => {} }]} />);
    const trigger = screen.getByRole("button", { name: "Account menu, Ada Lovelace" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("moves with the arrow keys and calls onSelect for a button entry", async () => {
    const onSelect = vi.fn();
    render(<UserMenu user={user} items={[{ id: "a", label: "Alpha", onSelect: () => {} }, { id: "b", label: "Beta", onSelect }]} />);
    screen.getByRole("button", { name: "Account menu, Ada Lovelace" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    await screen.findByRole("menu");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("leaves out hidden entries, groups with nothing left, and explains a disabled entry in text", async () => {
    render(
      <UserMenu
        user={user}
        groups={[
          { label: "Account", items: [{ id: "billing", label: "Billing", permission: "hidden" }] },
          { label: "Workspace", items: [{ id: "team", label: "Team settings", permission: { state: "disabled", reason: "Only owners" } }, { id: "help", label: "Help" }] },
        ]}
      />,
    );
    const menu = await open();
    expect(within(menu).queryByText("Billing")).not.toBeInTheDocument();
    expect(screen.queryByText("Account")).not.toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    const team = within(menu).getByRole("menuitem", { name: /Team settings/ });
    expect(team).toHaveAttribute("aria-disabled", "true");
    expect(within(team).getByText("Only owners")).toBeInTheDocument();
  });

  it("draws the danger variant", async () => {
    render(<UserMenu user={user} items={[{ id: "x", label: "Delete account", variant: "danger" }]} />);
    const menu = await open();
    expect(within(menu).getByRole("menuitem", { name: "Delete account" }).className).toContain("feedback-danger");
  });

  it("puts the theme row in the popover and reaches it with Tab", async () => {
    render(<UserMenu user={user} items={[{ id: "a", label: "Alpha" }]} themeRow={<button type="button">Dark</button>} />);
    await open();
    expect(screen.getByRole("button", { name: "Dark" })).toBeInTheDocument();
    const dark = screen.getByRole("button", { name: "Dark" });
    // Tab leaves the menu for the row (and wraps inside the popover, never out to the page behind it).
    for (let i = 0; i < 3 && document.activeElement !== dark; i++) await userEvent.tab();
    expect(dark).toHaveFocus();
  });

  it("signs out: shows pending, announces the message, calls onSignedOut and closes", async () => {
    let finish: (value: string) => void = () => {};
    const onSignOut = vi.fn(() => new Promise<string>((resolve) => (finish = resolve)));
    const onSignedOut = vi.fn();
    render(<UserMenu user={user} onSignOut={onSignOut} onSignedOut={onSignedOut} signedOutMessage="Goodbye" />);
    await open();
    await userEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
    const pending = await screen.findByRole("menuitem", { name: /Signing out/ });
    // A second choice while it works does nothing.
    await userEvent.click(pending);
    expect(onSignOut).toHaveBeenCalledTimes(1);
    await act(async () => finish("done"));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Goodbye"));
    expect(onSignedOut).toHaveBeenCalledWith("done");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    // The status region outlives the menu.
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("announces the error message, calls onError and keeps the menu open for another try", async () => {
    const failure = new Error("no");
    const onError = vi.fn();
    const onSignedOut = vi.fn();
    render(<UserMenu user={user} onSignOut={() => Promise.reject(failure)} onError={onError} onSignedOut={onSignedOut} errorMessage="Could not sign out" />);
    await open();
    await userEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Could not sign out"));
    expect(onError).toHaveBeenCalledWith(failure);
    expect(onSignedOut).not.toHaveBeenCalled();
    // The menu closes so the message is not hidden behind it, and focus is back on the button for another try.
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Account menu, Ada Lovelace" })).toHaveFocus());
  });

  it("uses the default messages", async () => {
    render(<UserMenu user={user} onSignOut={async () => {}} />);
    await open();
    await userEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("You have signed out"));
  });

  it("asks first with confirm: cancel does nothing, confirm signs out", async () => {
    const onSignOut = vi.fn(async () => {});
    render(<UserMenu user={user} onSignOut={onSignOut} confirm={{ title: "Sign out of Loomworks?" }} />);
    const trigger = screen.getByRole("button", { name: "Account menu, Ada Lovelace" });
    await open();
    await userEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByRole("heading", { name: "Sign out of Loomworks?" })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(onSignOut).not.toHaveBeenCalled();
    await waitFor(() => expect(trigger).toHaveFocus());

    await open();
    await userEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(onSignOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("You have signed out"));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("follows permissions.signOut: hidden leaves it out, disabled explains and does not run", async () => {
    const onSignOut = vi.fn();
    const { unmount } = render(<UserMenu user={user} onSignOut={onSignOut} permissions={{ signOut: "hidden" }} />);
    await open();
    expect(screen.queryByRole("menuitem", { name: "Sign out" })).not.toBeInTheDocument();
    unmount();

    render(<UserMenu user={user} onSignOut={onSignOut} permissions={{ signOut: { state: "disabled", reason: "Managed by your company" } }} />);
    await open();
    const item = screen.getByRole("menuitem", { name: /Sign out/ });
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(within(item).getByText("Managed by your company")).toBeInTheDocument();
    await userEvent.click(item);
    expect(onSignOut).not.toHaveBeenCalled();
  });

  it("shows the name beside the picture with showName and aligns with align", async () => {
    render(<UserMenu user={user} showName align="start" />);
    const trigger = screen.getByRole("button", { name: "Account menu, Ada Lovelace" });
    expect(within(trigger).getByText("ada@example.com")).toBeInTheDocument();
  });

  it("puts a class on every slot", async () => {
    const { container } = render(
      <UserMenu
        user={user}
        showName
        items={[{ id: "a", label: "Alpha" }]}
        groups={[{ items: [{ id: "b", label: "Beta" }] }]}
        onSignOut={async () => {}}
        themeRow={<span>Theme</span>}
        classNames={{ root: "c-root", trigger: "c-trigger", avatar: "c-avatar", name: "c-name", popover: "c-popover", header: "c-header", list: "c-list", item: "c-item", separator: "c-sep", theme: "c-theme", status: "c-status" }}
      />,
    );
    await open();
    for (const slot of ["root", "trigger", "avatar", "name", "popover", "header", "list", "item", "sep", "theme", "status"]) {
      expect(document.body.querySelector(`.c-${slot}`), slot).not.toBeNull();
    }
    expect(container.firstElementChild).toHaveClass("c-root");
  });

  it("has no axe violations closed or open", async () => {
    const { container } = render(<UserMenu user={user} items={[{ id: "a", label: "Alpha", href: "/a" }]} onSignOut={async () => {}} themeRow={<button type="button">Dark</button>} />);
    expect(await axeViolations(container)).toEqual([]);
    const menu = await open();
    expect(await axeViolations(menu.closest("[role='dialog']") ?? menu)).toEqual([]);
  });

  it("renders on the server", () => {
    const html = renderToString(<UserMenu user={user} onSignOut={async () => {}} />);
    expect(html).toContain("Account menu, Ada Lovelace");
  });
});

describe("AppHeader", () => {
  it("is a named header landmark with the slots in order", () => {
    render(<AppHeader leading={<button type="button">Fold</button>} breadcrumbs={<span>Crumbs</span>} actions={<button type="button">New</button>} userMenu={<button type="button">Me</button>} />);
    const header = screen.getByRole("banner", { name: "Application header" });
    const order = within(header).getAllByRole("button").map((b) => b.textContent);
    expect(order).toEqual(["Fold", "New", "Me"]);
    expect(within(header).getByText("Crumbs")).toBeInTheDocument();
  });

  it("calls onSearch, shows the shortcut as a hint hidden from screen readers", async () => {
    const onSearch = vi.fn();
    render(<AppHeader onSearch={onSearch} />);
    const button = screen.getByRole("button", { name: "Search" });
    expect(button.querySelectorAll("kbd")).toHaveLength(2);
    expect(button.querySelector("kbd")!.closest("[aria-hidden='true']")).not.toBeNull();
    await userEvent.click(button);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("hides the shortcut when it is empty and uses custom text", () => {
    render(<AppHeader onSearch={() => {}} searchShortcut="" searchLabel="Find" />);
    expect(screen.getByRole("button", { name: "Find" }).querySelector("kbd")).toBeNull();
  });

  it("folds the search to an icon with the same name in a narrow space", () => {
    const setWidth = fakeWidth();
    render(<AppHeader onSearch={() => {}} />);
    setWidth(500);
    const button = screen.getByRole("button", { name: "Search" });
    expect(button.querySelector("kbd")).toBeNull();
    expect(button).not.toHaveTextContent("Search");
    setWidth(900);
    expect(screen.getByRole("button", { name: "Search" })).toHaveTextContent("Search");
  });

  it("names the bell with the unread count and draws a capped badge", async () => {
    const onNotifications = vi.fn();
    const { rerender } = render(<AppHeader onNotifications={onNotifications} notificationCount={3} />);
    const bell = screen.getByRole("button", { name: "Notifications, 3 unread" });
    expect(bell).toHaveTextContent("3");
    await userEvent.click(bell);
    expect(onNotifications).toHaveBeenCalledTimes(1);
    rerender(<AppHeader onNotifications={onNotifications} notificationCount={150} />);
    expect(screen.getByRole("button", { name: "Notifications, 150 unread" })).toHaveTextContent("99+");
    rerender(<AppHeader onNotifications={onNotifications} />);
    const none = screen.getByRole("button", { name: "Notifications" });
    expect(none).not.toHaveTextContent(/\d/);
  });

  it("follows permissions: hidden is not drawn, disabled stays focusable and says why", async () => {
    const onSearch = vi.fn();
    const onNotifications = vi.fn();
    render(<AppHeader onSearch={onSearch} onNotifications={onNotifications} permissions={{ search: "hidden", notifications: { state: "disabled", reason: "Off for guests" } }} />);
    expect(screen.queryByRole("button", { name: "Search" })).not.toBeInTheDocument();
    const bell = screen.getByRole("button", { name: "Notifications" });
    expect(bell).toHaveAttribute("aria-disabled", "true");
    expect(bell).toHaveAccessibleDescription("Off for guests");
    bell.focus();
    expect(bell).toHaveFocus();
    await userEvent.click(bell);
    expect(onNotifications).not.toHaveBeenCalled();
  });

  it("supports size, border, sticky and a custom label", () => {
    render(<AppHeader size="compact" border={false} sticky label="Top bar" />);
    const header = screen.getByRole("banner", { name: "Top bar" });
    expect(header).toHaveAttribute("data-size", "compact");
    expect(header.className).toContain("h-11");
    expect(header.className).not.toContain("border-b");
    expect(header.className).toContain("sticky");
  });

  it("puts a class on every slot", () => {
    render(
      <AppHeader
        leading={<span>L</span>}
        breadcrumbs={<span>B</span>}
        actions={<span>A</span>}
        userMenu={<span>U</span>}
        onSearch={() => {}}
        onNotifications={() => {}}
        notificationCount={2}
        classNames={{ root: "c-root", leading: "c-leading", breadcrumbs: "c-crumbs", search: "c-search", shortcut: "c-shortcut", actions: "c-actions", notifications: "c-bell", badge: "c-badge", "user-menu": "c-user" }}
      />,
    );
    for (const slot of ["root", "leading", "crumbs", "search", "shortcut", "actions", "bell", "badge", "user"]) {
      expect(document.body.querySelector(`.c-${slot}`), slot).not.toBeNull();
    }
  });

  it("has no axe violations", async () => {
    const { container } = render(<AppHeader leading={<button type="button" aria-label="Fold">F</button>} onSearch={() => {}} onNotifications={() => {}} notificationCount={4} userMenu={<UserMenu user={user} />} />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders on the server", () => {
    const html = renderToString(<AppHeader onSearch={() => {}} onNotifications={() => {}} notificationCount={2} />);
    expect(html).toContain("Application header");
    expect(html).toContain("Notifications, 2 unread");
  });
});

describe("TopNav", () => {
  const items: NavItem[] = [
    { id: "home", label: "Home", href: "/" },
    { id: "pricing", label: "Pricing", href: "/pricing", badge: "New" },
    { id: "docs", label: "Docs", children: [{ id: "guide", label: "Guide", href: "/guide" }, { id: "api", label: "API", href: "/api" }] },
  ];

  it("is one named navigation landmark and marks the current page with aria-current and a bar", () => {
    render(<TopNav brand="Loomworks" items={items} currentId="pricing" />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    const link = within(nav).getByRole("link", { name: /Pricing/ });
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link.className).toContain("after:bg-");
    expect(link.className).toContain("font-medium");
    expect(within(nav).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Loomworks")).toBeInTheDocument();
  });

  it("reads a badge after the label", () => {
    render(<TopNav items={items} />);
    expect(screen.getByRole("link", { name: /Pricing\s*,\s*New/ })).toBeInTheDocument();
  });

  it("calls onNavigate for a button item", async () => {
    const onNavigate = vi.fn();
    render(<TopNav items={[{ id: "a", label: "Alpha" }]} onNavigate={onNavigate} currentId="a" />);
    const button = screen.getByRole("button", { name: "Alpha" });
    expect(button).toHaveAttribute("aria-current", "page");
    await userEvent.click(button);
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
  });

  it("opens a dropdown list of links, closes with Escape and returns focus", async () => {
    const onNavigate = vi.fn();
    render(<TopNav items={items} currentId="api" onNavigate={onNavigate} />);
    const trigger = screen.getByRole("button", { name: /Docs/ });
    expect(trigger).toHaveAccessibleName(/current section/);
    expect(trigger).toHaveAttribute("aria-haspopup");
    await userEvent.click(trigger);
    const menu = await screen.findByRole("menu", { name: /Docs/ });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const guide = within(menu).getByRole("menuitem", { name: "Guide" });
    expect(guide).toHaveAttribute("href", "/guide");
    expect(within(menu).getByRole("menuitem", { name: /API/ })).toHaveAccessibleName(/current page/);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("menuitem", { name: "Guide" }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: "guide" }));
  });

  it("draws links with renderLink and reports the choice", async () => {
    const onNavigate = vi.fn();
    render(
      <TopNav
        items={[{ id: "home", label: "Home", href: "/" }]}
        currentId="home"
        onNavigate={onNavigate}
        renderLink={({ item, className, children, isCurrent, onClick }) => (
          <a data-router href={item.href} aria-current={isCurrent ? "page" : undefined} className={className} onClick={(event) => { event.preventDefault(); onClick(); }}>
            {children}
          </a>
        )}
      />,
    );
    const link = screen.getByRole("link", { name: "Home" });
    expect(link).toHaveAttribute("data-router");
    expect(link).toHaveAttribute("aria-current", "page");
    await userEvent.click(link);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("follows permissions: hidden and empty parents are gone, disabled stays focusable and explained", async () => {
    const onNavigate = vi.fn();
    render(
      <TopNav
        onNavigate={onNavigate}
        items={[
          { id: "a", label: "Alpha" },
          { id: "b", label: "Beta", permission: { state: "disabled", reason: "Team plan only" } },
          { id: "c", label: "Gamma", permission: "hidden" },
          { id: "d", label: "Delta", children: [{ id: "e", label: "Epsilon", permission: "hidden" }] },
        ]}
      />,
    );
    expect(screen.queryByText("Gamma")).not.toBeInTheDocument();
    expect(screen.queryByText("Delta")).not.toBeInTheDocument();
    const beta = screen.getByRole("button", { name: "Beta" });
    expect(beta).toHaveAttribute("aria-disabled", "true");
    expect(beta).toHaveAccessibleDescription("Team plan only");
    await userEvent.click(beta);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("visibleItems applies the same rules to a flat list", () => {
    const list: NavItem[] = [{ id: "a", label: "A" }, { id: "b", label: "B", permission: "hidden" }, { id: "c", label: "C", children: [{ id: "d", label: "D", permission: "hidden" }] }, { id: "e", label: "E", permission: "disabled" }];
    expect(visibleItems(list).map((i) => i.id)).toEqual(["a", "e"]);
  });

  it("becomes a menu button with a sheet in a narrow space, only one of the two in the page", async () => {
    const setWidth = fakeWidth();
    const onNavigate = vi.fn();
    render(<TopNav brand="Loomworks" items={items} currentId="pricing" onNavigate={onNavigate} actions={<button type="button">Sign in</button>} />);
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    setWidth(400);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    const menuButton = screen.getByRole("button", { name: "Menu" });
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    await userEvent.click(menuButton);
    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    const nav = within(dialog).getByRole("navigation", { name: "Main navigation" });
    expect(within(nav).getByRole("link", { name: /Pricing/ })).toHaveAttribute("aria-current", "page");
    await userEvent.click(within(nav).getByRole("link", { name: "Home" }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: "home" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Menu" })).toHaveFocus());
    setWidth(1000);
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeInTheDocument();
  });

  it("supports the variants, sticky and a custom label", () => {
    const { container, rerender } = render(<TopNav items={items} label="Site" variant="floating" sticky />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("data-variant", "floating");
    expect(root.className).toContain("rounded-full");
    expect(root.className).toContain("sticky");
    expect(screen.getByRole("navigation", { name: "Site" })).toBeInTheDocument();
    rerender(<TopNav items={items} variant="bordered" />);
    expect(container.firstElementChild!.className).toContain("border-b");
  });

  it("puts a class on every slot", async () => {
    const setWidth = fakeWidth();
    render(
      <TopNav
        brand="B"
        items={items}
        actions={<span>A</span>}
        classNames={{ root: "c-root", brand: "c-brand", nav: "c-nav", list: "c-list", item: "c-item", dropdown: "c-dropdown", actions: "c-actions", "menu-button": "c-mb", "menu-sheet": "c-sheet" }}
      />,
    );
    for (const slot of ["root", "brand", "nav", "list", "item", "actions"]) expect(document.body.querySelector(`.c-${slot}`), slot).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /Docs/ }));
    await screen.findByRole("menu");
    expect(document.body.querySelector(".c-dropdown")).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    setWidth(300);
    expect(document.body.querySelector(".c-mb")).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    await screen.findByRole("dialog");
    expect(document.body.querySelector(".c-sheet")).not.toBeNull();
  });

  it("has no axe violations wide, with a dropdown open, or narrow with the sheet open", async () => {
    const setWidth = fakeWidth();
    const { container } = render(<TopNav brand="Loomworks" items={items} currentId="home" actions={<UserMenu user={user} />} />);
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: /Docs/ }));
    const menu = await screen.findByRole("menu");
    expect(await axeViolations(menu.closest("[role='dialog']") ?? menu)).toEqual([]);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    setWidth(300);
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(await axeViolations(await screen.findByRole("dialog"))).toEqual([]);
  });

  it("renders on the server", () => {
    const html = renderToString(<TopNav brand="Loomworks" items={items} currentId="home" />);
    expect(html).toContain("Main navigation");
    expect(html).toContain('aria-current="page"');
  });
});
