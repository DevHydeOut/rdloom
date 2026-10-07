"use client";

import { forwardRef, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button as AriaButton, DialogTrigger } from "react-aria-components";
import { dashboardShellDefaults, type DashboardShellSpecProps } from "../generated/dashboard-shell.types";
import { Sheet } from "../sheet/sheet";
import { AccountMenu, NavList, Sidebar, type NavProps } from "../sidebar/sidebar";
import { cx } from "../utils/cx";
import { MenuIcon, SearchIcon, SidebarIcon } from "../utils/icons";

export interface DashboardShellProps extends DashboardShellSpecProps {
  className?: string;
}

/** The parts of the shell that take a class name of their own. */
export type DashboardShellSlot = "root" | "skip-link" | "sidebar" | "collapse" | "nav" | "group" | "item" | "sub-list" | "account" | "header" | "search" | "actions" | "main" | "menu-sheet" | "team-switcher";
export type DashboardShellClassNames = Partial<Record<DashboardShellSlot, string>>;

const NARROW = 768;

/**
 * The frame of a dashboard or admin app: a sidebar of navigation (that folds down to icons), a top
 * bar, and the page. On a phone, or in any narrow space, the sidebar becomes a menu that slides in.
 * It fills its parent (give the parent a height, or use the whole screen), so the sidebar stays put
 * and only the page scrolls. It has no router of its own: items are links (with `href`, or through
 * `renderLink` for your router) or buttons (with `onNavigate`).
 */
export const DashboardShell = forwardRef<HTMLDivElement, DashboardShellProps>(function DashboardShell(
  {
    navigation,
    currentId,
    brand,
    team,
    teams,
    onTeamChange,
    user,
    header,
    actions,
    onSearch,
    searchLabel = dashboardShellDefaults.searchLabel,
    label = dashboardShellDefaults.label,
    skipLabel = dashboardShellDefaults.skipLabel,
    onNavigate,
    renderLink,
    sidebarAppearance = dashboardShellDefaults.sidebarAppearance,
    sidebarFooter,
    isCollapsed,
    defaultCollapsed = dashboardShellDefaults.defaultCollapsed,
    onCollapsedChange,
    children,
    classNames,
    className,
  },
  forwardedRef,
) {
  const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed);
  const collapsed = isCollapsed ?? innerCollapsed;
  const setCollapsed = (next: boolean) => {
    if (isCollapsed === undefined) setInnerCollapsed(next);
    onCollapsedChange?.(next);
  };
  const mainId = useId();
  const root = useRef<HTMLDivElement | null>(null);

  // Narrow means the space the shell is in, not the screen: a shell inside a small frame folds the same way a phone does.
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < NARROW));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const inset = sidebarAppearance === "inset";
  // The parts the sidebar draws; the others belong to the shell itself.
  const navClasses = { nav: classNames?.nav, group: classNames?.group, item: classNames?.item, "sub-list": classNames?.["sub-list"], account: classNames?.account, "team-switcher": classNames?.["team-switcher"] };
  const nav = { groups: navigation, currentId, label, onNavigate, renderLink, classNames: navClasses } satisfies Partial<NavProps>;

  return (
    <div
      ref={(node) => {
        root.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      data-compact={compact || undefined}
      className={cx("group/shell relative flex h-full min-h-0 w-full overflow-hidden text-[var(--rd-color-text-default)]", inset ? "bg-[var(--rd-color-surface-subtle)]" : "bg-[var(--rd-color-surface-default)]", className, classNames?.root)}
    >
      <a
        href={`#${mainId}`}
        onClick={(event) => {
          // A hash link scrolls but doesn't always move keyboard focus: do it.
          const target = document.getElementById(mainId);
          if (!target) return;
          event.preventDefault();
          target.focus();
        }}
        className={cx("sr-only z-50 rounded-[var(--rd-radius-control)] bg-[var(--rd-color-surface-raised)] px-3 py-2 text-sm font-medium [box-shadow:var(--rd-elevation-floating)] focus:not-sr-only focus:absolute focus:start-3 focus:top-3", classNames?.["skip-link"])}
      >
        {skipLabel}
      </a>

      {/* The sidebar, where there is room for one. The shell folds it from the top bar, so the sidebar's own button is off. */}
      <div
        className={cx(
          "hidden shrink-0 transition-[width] duration-200 motion-reduce:transition-none md:flex group-data-[compact]/shell:!hidden",
          collapsed ? "w-[4.5rem]" : "w-64",
          classNames?.sidebar,
        )}
      >
        <Sidebar
          navigation={navigation}
          currentId={currentId}
          label={label}
          onNavigate={onNavigate}
          renderLink={renderLink}
          brand={brand}
          team={team}
          teams={teams}
          onTeamChange={onTeamChange}
          user={user}
          isCollapsed={collapsed}
          onCollapsedChange={setCollapsed}
          appearance={sidebarAppearance}
          footer={sidebarFooter}
          collapsible={false}
          classNames={navClasses}
          className={sidebarAppearance === "floating" ? "[--rd-sidebar-rail:calc(100%-1rem)] [--rd-sidebar-width:calc(100%-1rem)]" : "[--rd-sidebar-rail:100%] [--rd-sidebar-width:100%]"}
        />
      </div>

      <div className={cx("flex min-w-0 flex-1 flex-col", inset && "p-2 ps-0 group-data-[compact]/shell:p-0")}>
        <div className={cx("flex min-h-0 flex-1 flex-col", inset && "overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] [box-shadow:var(--rd-elevation-raised)] group-data-[compact]/shell:rounded-none group-data-[compact]/shell:border-0")}>
        <header className={cx("flex h-14 shrink-0 items-center gap-3 border-b border-[var(--rd-color-border-default)] px-4", classNames?.header)}>
          {/* The same navigation as a slide-in menu, where the sidebar is hidden */}
          <div className="block md:hidden group-data-[compact]/shell:!block">
            <DialogTrigger>
              <AriaButton
                aria-label="Open navigation"
                className="flex size-9 items-center justify-center rounded-[var(--rd-radius-control)] text-[var(--rd-color-text-default)] outline-none data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
              >
                <MenuIcon className="size-5" />
              </AriaButton>
              <Sheet title={typeof brand === "string" ? brand : "Menu"} side="start" size="sm" className={classNames?.["menu-sheet"]}>
                {({ close }) => (
                  <div className="-m-6 flex h-[calc(100%+3rem)] min-h-0 flex-col">
                    <NavList {...nav} collapsed={false} onPick={close} />
                    {user && <AccountMenu user={user} collapsed={false} className={classNames?.account} />}
                  </div>
                )}
              </Sheet>
            </DialogTrigger>
          </div>
          {/* Fold or open the sidebar from the top bar, next to what you are looking at. */}
          <div className="hidden items-center gap-3 md:flex group-data-[compact]/shell:!hidden">
            <AriaButton
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              onPress={() => setCollapsed(!collapsed)}
              className={cx("flex size-8 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] text-[var(--rd-color-text-muted)] outline-none data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]", classNames?.collapse)}
            >
              <SidebarIcon className="size-[18px]" />
            </AriaButton>
            <span aria-hidden="true" className="h-4 w-px bg-[var(--rd-color-border-default)]" />
          </div>
          <div className="flex min-w-0 flex-1 items-center">{header}</div>
          {onSearch && (
            <AriaButton
              onPress={onSearch}
              aria-label={searchLabel}
              className={cx("flex h-9 items-center gap-2 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-3 text-sm text-[var(--rd-color-text-muted)] outline-none data-[hovered]:border-[var(--rd-color-border-strong)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] sm:w-56", classNames?.search)}
            >
              <SearchIcon className="size-4" />
              <span className="hidden flex-1 text-start sm:inline">{searchLabel}</span>
            </AriaButton>
          )}
          {actions && <div className={cx("flex shrink-0 items-center gap-2", classNames?.actions)}>{actions}</div>}
        </header>
        <main id={mainId} tabIndex={-1} className={cx("min-h-0 flex-1 overflow-y-auto outline-none", classNames?.main)}>
          {children as ReactNode}
        </main>
        </div>
      </div>
    </div>
  );
});
