"use client";

import { forwardRef, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button as AriaButton, TooltipTrigger } from "react-aria-components";
import { appHeaderDefaults, type AppHeaderSpecProps } from "../generated/app-header.types";
import { Kbd } from "../kbd/kbd";
import { Tooltip } from "../tooltip/tooltip";
import { cx } from "../utils/cx";
import { BellIcon, SearchIcon } from "../utils/icons";
import { resolvePermission, type PermissionValue } from "../utils/permissions";

export interface AppHeaderProps extends AppHeaderSpecProps {
  className?: string;
}

/** The parts of the header that take a class name of their own. */
export type AppHeaderSlot = "root" | "leading" | "breadcrumbs" | "search" | "shortcut" | "actions" | "notifications" | "badge" | "user-menu";
export type AppHeaderClassNames = Partial<Record<AppHeaderSlot, string>>;

const NARROW = 640;

const focusRing = "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

/** One button of the bar. A disabled one stays focusable and says why; a hidden one is not drawn. */
function BarButton({ permission, onPress, label, className, children }: { permission: PermissionValue | undefined; onPress?: () => void; label: string; className: string; children: ReactNode }) {
  const reasonId = useId();
  const access = resolvePermission(permission);
  if (!access.isVisible) return null;
  if (access.isDisabled) {
    const button = (
      <AriaButton aria-label={label} aria-disabled="true" aria-describedby={access.reason ? reasonId : undefined} onPress={() => {}} className={cx(className, "cursor-not-allowed opacity-50")}>
        {children}
      </AriaButton>
    );
    return (
      <>
        {access.reason ? (
          <TooltipTrigger delay={300}>
            {button}
            <Tooltip>{access.reason}</Tooltip>
          </TooltipTrigger>
        ) : (
          button
        )}
        {access.reason && (
          <span id={reasonId} className="sr-only">
            {access.reason}
          </span>
        )}
      </>
    );
  }
  return (
    <AriaButton aria-label={label} onPress={onPress} className={className}>
      {children}
    </AriaButton>
  );
}

/**
 * The top bar of an application: a slot for the sidebar toggle, the breadcrumbs, a search button that
 * opens your command palette, your own actions, a notifications bell with an unread count and the
 * account menu. It is a header landmark. Where the space it is in is narrow, the search folds to an icon.
 */
export const AppHeader = forwardRef<HTMLElement, AppHeaderProps>(function AppHeader(
  {
    leading,
    breadcrumbs,
    onSearch,
    searchLabel = appHeaderDefaults.searchLabel,
    searchShortcut = appHeaderDefaults.searchShortcut,
    onNotifications,
    notificationCount = appHeaderDefaults.notificationCount,
    notificationsLabel = appHeaderDefaults.notificationsLabel,
    actions,
    userMenu,
    permissions,
    label = appHeaderDefaults.label,
    size = appHeaderDefaults.size,
    border = appHeaderDefaults.border,
    sticky = appHeaderDefaults.sticky,
    classNames,
    className,
  },
  forwardedRef,
) {
  const root = useRef<HTMLElement | null>(null);
  // Narrow means the space the bar is in, not the screen.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < NARROW));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const compact = size === "compact";
  const iconButton = cx(
    "relative flex shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] text-[var(--rd-color-text-muted)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)]",
    focusRing,
    compact ? "size-8" : "size-9",
  );
  const shortcutKeys = searchShortcut.split(" ").filter(Boolean);
  const unread = Math.max(0, Math.floor(notificationCount));

  // Narrow with actions beside the breadcrumbs: the trail moves to its own row so neither is squeezed out.
  const stacked = narrow && !!breadcrumbs && !!actions;
  return (
    <header
      ref={(node) => {
        root.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      aria-label={label}
      data-size={size}
      data-narrow={narrow || undefined}
      className={cx(
        "flex w-full items-center gap-3 bg-[var(--rd-color-surface-default)] px-4 text-[var(--rd-color-text-default)]",
        stacked ? "h-auto flex-wrap py-2" : compact ? "h-11" : "h-14",
        border && "border-b border-[var(--rd-color-border-default)]",
        sticky && "sticky top-0 z-30",
        className,
        classNames?.root,
      )}
    >
      {leading && <div className={cx("flex shrink-0 items-center gap-2", classNames?.leading)}>{leading}</div>}
      <div className={cx("flex min-w-0 items-center", stacked ? "order-last basis-full" : "flex-1", classNames?.breadcrumbs)}>{breadcrumbs}</div>
      {stacked && <div aria-hidden="true" className="flex-1" />}
      {onSearch && (
        <BarButton
          permission={permissions?.search}
          onPress={onSearch}
          label={searchLabel}
          className={cx(
            narrow
              ? iconButton
              : cx(
                  "flex items-center gap-2 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-3 text-sm text-[var(--rd-color-text-muted)] data-[hovered]:border-[var(--rd-color-border-strong)] w-56",
                  focusRing,
                  compact ? "h-8" : "h-9",
                ),
            classNames?.search,
          )}
        >
          <SearchIcon className="size-4 shrink-0" />
          {!narrow && (
            <>
              <span className="flex-1 truncate text-start">{searchLabel}</span>
              {/* A hint for the eyes: the button's name already says what it does. */}
              {shortcutKeys.length > 0 && (
                <span aria-hidden="true" className={cx("flex shrink-0 items-center gap-1", classNames?.shortcut)}>
                  {shortcutKeys.map((key) => (
                    <Kbd key={key} size="sm">
                      {key}
                    </Kbd>
                  ))}
                </span>
              )}
            </>
          )}
        </BarButton>
      )}
      {actions && <div className={cx("flex shrink-0 items-center gap-2", classNames?.actions)}>{actions}</div>}
      {onNotifications && (
        <BarButton
          permission={permissions?.notifications}
          onPress={onNotifications}
          label={unread > 0 ? `${notificationsLabel}, ${unread} unread` : notificationsLabel}
          className={cx(iconButton, classNames?.notifications)}
        >
          <BellIcon className="size-[18px]" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className={cx(
                "absolute -end-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-[var(--rd-color-action-primary)] px-1 text-[10px] leading-4 font-semibold text-[var(--rd-color-action-on-primary)] tabular-nums ring-2 ring-[var(--rd-color-surface-default)]",
                classNames?.badge,
              )}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </BarButton>
      )}
      {userMenu && <div className={cx("flex shrink-0 items-center", classNames?.["user-menu"])}>{userMenu}</div>}
    </header>
  );
});
