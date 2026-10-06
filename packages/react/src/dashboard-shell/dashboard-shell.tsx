"use client";

import { forwardRef, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button as AriaButton, DialogTrigger, Link as AriaLink } from "react-aria-components";
import { dashboardShellDefaults, type DashboardShellSpecProps } from "../generated/dashboard-shell.types";
import { Avatar } from "../avatar/avatar";
import { Menu, MenuItem, MenuTrigger } from "../menu/menu";
import { Sheet } from "../sheet/sheet";
import { Tooltip, TooltipTrigger } from "../tooltip/tooltip";
import { cx } from "../utils/cx";
import { ChevronDownIcon, MenuIcon, SearchIcon, SidebarIcon } from "../utils/icons";
import { badgeText, currentTopLevel, initialOf, type NavGroup, type NavItem, type ShellUser } from "./nav";

export interface DashboardShellProps extends DashboardShellSpecProps {
  className?: string;
}

const NARROW = 768;

const linkBase =
  "relative flex w-full items-center gap-3 rounded-[var(--rd-radius-control)] px-3 py-1.5 text-start text-sm outline-none transition-colors " +
  "min-h-[var(--rd-size-control-sm)] text-[var(--rd-color-text-muted)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] motion-reduce:transition-none";
// The current page is shown three ways: a tinted background, a bar on the edge, and a heavier label. It is also aria-current.
const linkCurrent =
  "bg-[var(--rd-color-surface-selected)] font-medium !text-[var(--rd-color-text-default)] before:absolute before:inset-y-1.5 before:start-0 before:w-[3px] before:rounded-full before:bg-[var(--rd-color-action-primary)]";

type RenderLink = NonNullable<DashboardShellSpecProps["renderLink"]>;

interface NavProps {
  groups: NavGroup[];
  currentId?: string;
  collapsed: boolean;
  label: string;
  onNavigate?: (item: NavItem) => void;
  renderLink?: RenderLink;
  /** Called after an item is chosen: the mobile menu closes itself with it. */
  onPick?: () => void;
  /** Ask the sidebar to open (a collapsed parent has nowhere to show its sub-items). */
  onExpand?: () => void;
}

function Badge({ value, collapsed }: { value: string | number | undefined; collapsed: boolean }) {
  const text = badgeText(value);
  if (!text) return null;
  return (
    <>
      {/* Spoken after the label. Drawn as a small pill, or as a dot when the sidebar is folded and there is no room for it. */}
      <span className="sr-only">, {text}</span>
      {collapsed ? (
        <span aria-hidden="true" className="absolute end-2 top-1.5 size-2 rounded-full bg-[var(--rd-color-action-primary)] ring-2 ring-[var(--rd-color-surface-default)]" />
      ) : (
        <span
          aria-hidden="true"
          className="ms-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--rd-color-surface-subtle)] px-1.5 text-[11px] leading-5 font-medium text-[var(--rd-color-text-default)] tabular-nums"
        >
          {text}
        </span>
      )}
    </>
  );
}

function ItemBody({ item, collapsed, nested }: { item: NavItem; collapsed: boolean; nested?: boolean }) {
  return (
    <>
      {/* A sub-item sits under its parent's icon, so it needs none; a top-level item without one gets its first letter. */}
      {(item.icon || !nested) && (
        <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center text-[var(--rd-color-text-muted)] group-data-[current]/nav:text-[var(--rd-color-action-primary)]">
          {item.icon ?? <span className="flex size-5 items-center justify-center rounded bg-[var(--rd-color-surface-subtle)] text-[11px] font-semibold">{initialOf(item.label)}</span>}
        </span>
      )}
      <span className={cx("min-w-0 flex-1 truncate", collapsed && "sr-only")}>{item.label}</span>
      <Badge value={item.badge} collapsed={collapsed} />
    </>
  );
}

function Entry({ item, nested, current, parentOf, ...nav }: { item: NavItem; nested?: boolean; current: boolean; parentOf: boolean } & NavProps) {
  const { collapsed, onNavigate, renderLink, onPick, onExpand } = nav;
  const listId = useId();
  const [open, setOpen] = useState(parentOf);
  useEffect(() => {
    if (parentOf) setOpen(true);
  }, [parentOf]);
  const iconOnly = collapsed && !nested;
  const className = cx(linkBase, "group/nav", current && linkCurrent, parentOf && !current && "font-medium !text-[var(--rd-color-text-default)]", iconOnly && "justify-center px-0", nested && "min-h-8 py-1");
  const body = <ItemBody item={item} collapsed={iconOnly} nested={nested} />;

  if (item.children?.length) {
    return (
      <li>
        <AriaButton
          aria-expanded={open && !collapsed}
          aria-controls={listId}
          onPress={() => {
            if (collapsed) {
              onExpand?.();
              setOpen(true);
            } else setOpen((v) => !v);
          }}
          className={cx(className)}
        >
          {body}
          {!collapsed && <ChevronDownIcon className={cx("size-4 shrink-0 text-[var(--rd-color-text-muted)] transition-transform motion-reduce:transition-none", open ? "rotate-180" : "")} />}
        </AriaButton>
        {/* Closed lists stay in the page, hidden, so their links are still there for search and for the current page's own parent. */}
        <ul id={listId} hidden={!open || collapsed} className="mt-0.5 ms-5 flex flex-col gap-0.5 border-s border-[var(--rd-color-border-default)] ps-2">
          {item.children.map((child) => (
            <Entry key={child.id} item={child} nested current={nav.currentId === child.id} parentOf={false} {...nav} />
          ))}
        </ul>
      </li>
    );
  }

  const choose = () => {
    onNavigate?.(item);
    onPick?.();
  };

  if (renderLink) {
    return <li>{renderLink({ item, className: cx(className, "data-[hovered]:bg-[var(--rd-color-surface-subtle)]"), children: body, isCurrent: current, onClick: choose })}</li>;
  }

  const control = item.href ? (
    <AriaLink href={item.href} aria-current={current ? "page" : undefined} data-current={current || undefined} onPress={choose} className={className}>
      {body}
    </AriaLink>
  ) : (
    <AriaButton aria-current={current ? "page" : undefined} data-current={current || undefined} onPress={choose} className={className}>
      {body}
    </AriaButton>
  );

  return (
    <li>
      {iconOnly ? (
        <TooltipTrigger delay={300}>
          {control}
          <Tooltip placement="end">{item.label}</Tooltip>
        </TooltipTrigger>
      ) : (
        control
      )}
    </li>
  );
}

function NavList(props: NavProps) {
  const { groups, currentId, collapsed, label } = props;
  const top = currentTopLevel(groups, currentId);
  return (
    <nav aria-label={label} className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 py-2">
      {groups.map((group, g) => (
        <div key={g} className="flex flex-col gap-1">
          {group.label &&
            (collapsed ? (
              <div role="separator" className="mx-2 my-1 border-t border-[var(--rd-color-border-default)]" />
            ) : (
              <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-[var(--rd-color-text-muted)] uppercase">{group.label}</p>
            ))}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <Entry key={item.id} item={item} current={currentId === item.id} parentOf={top?.id === item.id && top.id !== currentId} {...props} />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function AccountMenu({ user, collapsed }: { user: ShellUser; collapsed: boolean }) {
  const trigger = (
    <AriaButton
      aria-label={`Account menu, ${user.name}`}
      className={cx(
        "flex w-full items-center gap-3 rounded-[var(--rd-radius-control)] p-2 text-start outline-none data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
        collapsed && "justify-center",
      )}
    >
      <Avatar name={user.name} src={user.avatarUrl} size="sm" decorative />
      {!collapsed && (
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-[var(--rd-color-text-default)]">{user.name}</span>
          {user.email && <span className="truncate text-xs text-[var(--rd-color-text-muted)]">{user.email}</span>}
        </span>
      )}
      {!collapsed && <ChevronDownIcon className="size-4 shrink-0 text-[var(--rd-color-text-muted)]" />}
    </AriaButton>
  );
  if (!user.menu?.length) return <div className="p-1">{trigger}</div>;
  return (
    <div className="border-t border-[var(--rd-color-border-default)] p-2">
      <MenuTrigger>
        {trigger}
        <Menu placement="top start">
          {user.menu.map((entry) => (
            <MenuItem key={entry.id} id={entry.id} variant={entry.variant} onAction={entry.onSelect}>
              {entry.label}
            </MenuItem>
          ))}
        </Menu>
      </MenuTrigger>
    </div>
  );
}

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
    user,
    header,
    actions,
    onSearch,
    searchLabel = dashboardShellDefaults.searchLabel,
    label = dashboardShellDefaults.label,
    skipLabel = dashboardShellDefaults.skipLabel,
    onNavigate,
    renderLink,
    isCollapsed,
    defaultCollapsed = dashboardShellDefaults.defaultCollapsed,
    onCollapsedChange,
    children,
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

  const nav = { groups: navigation, currentId, label, onNavigate, renderLink } satisfies Partial<NavProps>;

  return (
    <div
      ref={(node) => {
        root.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      data-compact={compact || undefined}
      className={cx("group/shell relative flex h-full min-h-0 w-full overflow-hidden bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)]", className)}
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
        className="sr-only z-50 rounded-[var(--rd-radius-control)] bg-[var(--rd-color-surface-raised)] px-3 py-2 text-sm font-medium [box-shadow:var(--rd-elevation-floating)] focus:not-sr-only focus:absolute focus:start-3 focus:top-3"
      >
        {skipLabel}
      </a>

      {/* The sidebar, where there is room for one */}
      <div
        className={cx(
          "hidden shrink-0 flex-col border-e border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] transition-[width] duration-200 motion-reduce:transition-none md:flex group-data-[compact]/shell:!hidden",
          collapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <div className={cx("flex h-14 shrink-0 items-center gap-2 px-4", collapsed && "justify-center px-0")}>
          {!collapsed && <div className="min-w-0 flex-1 truncate text-[15px] font-semibold">{brand}</div>}
          <AriaButton
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onPress={() => setCollapsed(!collapsed)}
            className="flex size-8 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] text-[var(--rd-color-text-muted)] outline-none data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
          >
            <SidebarIcon className="size-[18px]" />
          </AriaButton>
        </div>
        <NavList {...nav} collapsed={collapsed} onExpand={() => setCollapsed(false)} />
        {user && <AccountMenu user={user} collapsed={collapsed} />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--rd-color-border-default)] px-4">
          {/* The same navigation as a slide-in menu, where the sidebar is hidden */}
          <div className="block md:hidden group-data-[compact]/shell:!block">
            <DialogTrigger>
              <AriaButton
                aria-label="Open navigation"
                className="flex size-9 items-center justify-center rounded-[var(--rd-radius-control)] text-[var(--rd-color-text-default)] outline-none data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
              >
                <MenuIcon className="size-5" />
              </AriaButton>
              <Sheet title={typeof brand === "string" ? brand : "Menu"} side="start" size="sm">
                {({ close }) => (
                  <div className="-m-6 flex h-[calc(100%+3rem)] min-h-0 flex-col">
                    <NavList {...nav} collapsed={false} onPick={close} />
                    {user && <AccountMenu user={user} collapsed={false} />}
                  </div>
                )}
              </Sheet>
            </DialogTrigger>
          </div>
          <div className="flex min-w-0 flex-1 items-center">{header}</div>
          {onSearch && (
            <AriaButton
              onPress={onSearch}
              aria-label={searchLabel}
              className="flex h-9 items-center gap-2 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-3 text-sm text-[var(--rd-color-text-muted)] outline-none data-[hovered]:border-[var(--rd-color-border-strong)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] sm:w-56"
            >
              <SearchIcon className="size-4" />
              <span className="hidden flex-1 text-start sm:inline">{searchLabel}</span>
            </AriaButton>
          )}
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
        <main id={mainId} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none">
          {children as ReactNode}
        </main>
      </div>
    </div>
  );
});
