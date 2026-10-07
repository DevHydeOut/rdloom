"use client";

import { forwardRef, useEffect, useId, useState, type ReactNode } from "react";
import { Button as AriaButton, Link as AriaLink } from "react-aria-components";
import { sidebarDefaults, type SidebarSpecProps } from "../generated/sidebar.types";
import { Avatar } from "../avatar/avatar";
import { Menu, MenuItem, MenuTrigger } from "../menu/menu";
import { Tooltip, TooltipTrigger } from "../tooltip/tooltip";
import { cx } from "../utils/cx";
import { ChevronRightIcon, ChevronsUpDownIcon, SearchIcon, SidebarIcon } from "../utils/icons";
import { badgeText, currentTopLevel, initialOf, type NavGroup, type NavItem, type ShellTeam, type ShellUser } from "./nav";

export interface SidebarProps extends SidebarSpecProps {
  className?: string;
}

const linkBase =
  "relative flex w-full items-center gap-3 rounded-[var(--rd-radius-control)] px-3 py-1.5 text-start text-sm outline-none transition-colors " +
  "min-h-[var(--rd-size-control-sm)] text-[var(--rd-color-text-muted)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] motion-reduce:transition-none";
// The current page: a soft tinted background, the accent color on its icon, and a heavier label. It is also aria-current.
// No thick bar on one edge: the tint and the weight carry it.
const linkCurrent = "bg-[var(--rd-color-surface-selected)] font-medium !text-[var(--rd-color-text-default)]";

type RenderLink = NonNullable<SidebarSpecProps["renderLink"]>;

export interface NavProps {
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
          {!collapsed && <ChevronRightIcon className={cx("size-4 shrink-0 text-[var(--rd-color-text-muted)] transition-transform motion-reduce:transition-none", open ? "rotate-90" : "")} />}
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

export function NavList(props: NavProps) {
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
              <p className="px-3 pb-1 text-xs font-medium text-[var(--rd-color-text-muted)]">{group.label}</p>
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

function TeamLogo({ team }: { team: ShellTeam }) {
  return (
    <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] bg-[var(--rd-color-text-default)] text-sm font-semibold text-[var(--rd-color-surface-default)]">
      {team.logo ?? initialOf(team.name)}
    </span>
  );
}

/** The name of the organisation or workspace at the top of the sidebar. With several to choose from it is a menu. */
export function TeamSwitcher({ team, teams, onSelect, collapsed }: { team: ShellTeam; teams?: ShellTeam[]; onSelect?: (team: ShellTeam) => void; collapsed: boolean }) {
  const body = (
    <>
      <TeamLogo team={team} />
      {!collapsed && (
        <span className="flex min-w-0 flex-1 flex-col text-start leading-tight">
          <span className="truncate text-sm font-semibold text-[var(--rd-color-text-default)]">{team.name}</span>
          {team.description && <span className="truncate text-xs text-[var(--rd-color-text-muted)]">{team.description}</span>}
        </span>
      )}
      {!collapsed && teams && teams.length > 1 && <ChevronsUpDownIcon className="size-4 shrink-0 text-[var(--rd-color-text-muted)]" />}
    </>
  );
  const classes = cx(
    "flex w-full items-center gap-2.5 rounded-[var(--rd-radius-control)] p-1.5 outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
    collapsed && "justify-center",
  );
  if (!teams || teams.length < 2) return <div className={classes}>{body}</div>;
  return (
    <MenuTrigger>
      <AriaButton aria-label={`Switch workspace, current: ${team.name}`} className={cx(classes, "data-[hovered]:bg-[var(--rd-color-surface-subtle)]")}>
        {body}
      </AriaButton>
      <Menu placement="bottom start" aria-label="Workspaces">
        {teams.map((t) => (
          <MenuItem key={t.id ?? t.name} id={t.id ?? t.name} textValue={t.name} onAction={() => onSelect?.(t)}>
            {t.name}
          </MenuItem>
        ))}
      </Menu>
    </MenuTrigger>
  );
}

export function AccountMenu({ user, collapsed }: { user: ShellUser; collapsed: boolean }) {
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
      {!collapsed && <ChevronsUpDownIcon className="size-4 shrink-0 text-[var(--rd-color-text-muted)]" />}
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

const appearances = {
  bordered: "border-e border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]",
  subtle: "bg-[var(--rd-color-surface-subtle)]",
  inset: "bg-transparent",
  floating: "m-2 h-[calc(100%-1rem)] rounded-2xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] [box-shadow:var(--rd-elevation-raised)]",
} as const;

/**
 * A sidebar of navigation: the team or product name at the top, grouped links (with one level of
 * sub-items and badges), an optional footer, and the signed-in person at the bottom. It can fold down
 * to icons. It fills the height of its parent and has no router of its own: items are links (with
 * `href`, or through `renderLink` for your router) or buttons (with `onNavigate`). It is only the
 * panel. For the full frame with a top bar and a phone menu use DashboardShell.
 */
export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(function Sidebar(
  {
    navigation,
    currentId,
    brand,
    team,
    teams,
    onTeamChange,
    user,
    footer,
    onSearch,
    searchLabel = sidebarDefaults.searchLabel,
    label = sidebarDefaults.label,
    onNavigate,
    renderLink,
    onPick,
    isCollapsed,
    defaultCollapsed = sidebarDefaults.defaultCollapsed,
    onCollapsedChange,
    collapsible = sidebarDefaults.collapsible,
    appearance = sidebarDefaults.appearance,
    className,
  },
  ref,
) {
  const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed);
  const collapsed = isCollapsed ?? innerCollapsed;
  const setCollapsed = (next: boolean) => {
    if (isCollapsed === undefined) setInnerCollapsed(next);
    onCollapsedChange?.(next);
  };

  const toggle = (
    <AriaButton
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
      onPress={() => setCollapsed(!collapsed)}
      className={cx(
        "flex min-h-[var(--rd-size-control-sm)] w-full items-center gap-3 rounded-[var(--rd-radius-control)] px-3 text-start text-sm text-[var(--rd-color-text-muted)] outline-none data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
        collapsed && "justify-center px-0",
      )}
    >
      <SidebarIcon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">Collapse</span>}
    </AriaButton>
  );

  return (
    <div
      ref={ref}
      data-collapsed={collapsed || undefined}
      data-appearance={appearance}
      className={cx(
        "flex h-full min-h-0 shrink-0 flex-col overflow-hidden transition-[width] duration-200 motion-reduce:transition-none",
        collapsed ? "w-[var(--rd-sidebar-rail,4.5rem)]" : "w-[var(--rd-sidebar-width,16rem)]",
        appearances[appearance],
        className,
      )}
    >
      <div className={cx("flex h-14 shrink-0 items-center px-3", collapsed && "justify-center")}>
        {team ? (
          <TeamSwitcher team={team} teams={teams} onSelect={onTeamChange} collapsed={collapsed} />
        ) : (
          !collapsed && <div className="min-w-0 flex-1 truncate px-1 text-[15px] font-semibold">{brand}</div>
        )}
      </div>
      {onSearch && (
        <div className="px-3 pb-1">
          {collapsed ? (
            <TooltipTrigger delay={300}>
              <AriaButton
                onPress={onSearch}
                aria-label={searchLabel}
                className="flex size-9 w-full items-center justify-center rounded-[var(--rd-radius-control)] text-[var(--rd-color-text-muted)] outline-none data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
              >
                <SearchIcon className="size-4" />
              </AriaButton>
              <Tooltip placement="end">{searchLabel}</Tooltip>
            </TooltipTrigger>
          ) : (
            <AriaButton
              onPress={onSearch}
              className="flex h-9 w-full items-center gap-2 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-3 text-sm text-[var(--rd-color-text-muted)] outline-none data-[hovered]:border-[var(--rd-color-border-strong)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
            >
              <SearchIcon className="size-4" />
              <span className="flex-1 truncate text-start">{searchLabel}</span>
            </AriaButton>
          )}
        </div>
      )}
      <NavList groups={navigation} currentId={currentId} label={label} collapsed={collapsed} onNavigate={onNavigate} renderLink={renderLink} onPick={onPick} onExpand={() => setCollapsed(false)} />
      {footer && !collapsed && <div className="shrink-0 px-3 pb-2">{footer as ReactNode}</div>}
      {collapsible && (
        <div className="shrink-0 px-3 pb-2">
          {collapsed ? (
            <TooltipTrigger delay={300}>
              {toggle}
              <Tooltip placement="end">Expand sidebar</Tooltip>
            </TooltipTrigger>
          ) : (
            toggle
          )}
        </div>
      )}
      {user && <AccountMenu user={user} collapsed={collapsed} />}
    </div>
  );
});
