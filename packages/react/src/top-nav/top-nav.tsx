"use client";

import { forwardRef, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button as AriaButton, DialogTrigger, Link as AriaLink, MenuTrigger, TooltipTrigger } from "react-aria-components";
import { topNavDefaults, type TopNavSpecProps } from "../generated/top-nav.types";
import { Menu, MenuItem } from "../menu/menu";
import { Sheet } from "../sheet/sheet";
import { NavList } from "../sidebar/sidebar";
import { badgeText, currentTopLevel, navPermission, visibleItems, type NavItem } from "../sidebar/nav";
import { Tooltip } from "../tooltip/tooltip";
import { cx } from "../utils/cx";
import { ChevronDownIcon, MenuIcon } from "../utils/icons";

export interface TopNavProps extends TopNavSpecProps {
  className?: string;
}

/** The parts of the top navigation that take a class name of their own. */
export type TopNavSlot = "root" | "brand" | "nav" | "list" | "item" | "dropdown" | "actions" | "menu-button" | "menu-sheet";
export type TopNavClassNames = Partial<Record<TopNavSlot, string>>;

const NARROW = 768;

const focusRing = "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";
const linkBase =
  "relative flex min-h-[var(--rd-size-control-sm)] items-center gap-2 rounded-[var(--rd-radius-control)] px-3 py-1.5 text-sm whitespace-nowrap text-[var(--rd-color-text-muted)] transition-colors " +
  "data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] motion-reduce:transition-none " +
  focusRing;
// The current page: a heavier label and a bar under it as well as the stronger color, so it is not shown by color alone.
const linkCurrent = "font-medium !text-[var(--rd-color-text-default)] after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-[var(--rd-color-text-default)]";

function ItemBody({ item }: { item: NavItem }) {
  const badge = badgeText(item.badge);
  return (
    <>
      {item.icon && (
        <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">
          {item.icon}
        </span>
      )}
      <span>{item.label}</span>
      {badge && (
        <>
          <span className="sr-only">, {badge}</span>
          <span aria-hidden="true" className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--rd-color-surface-subtle)] px-1.5 text-[11px] leading-5 font-medium text-[var(--rd-color-text-default)] tabular-nums">
            {badge}
          </span>
        </>
      )}
    </>
  );
}

interface EntryProps extends Pick<TopNavSpecProps, "onNavigate" | "renderLink"> {
  item: NavItem;
  currentId?: string;
  classNames?: TopNavClassNames;
  /** True when a sub-item of this one is the current page. */
  isParentOfCurrent: boolean;
}

function Entry({ item, currentId, onNavigate, renderLink, classNames, isParentOfCurrent }: EntryProps) {
  const reasonId = useId();
  const permission = navPermission(item);
  const current = currentId === item.id;
  const className = cx(linkBase, current && linkCurrent, isParentOfCurrent && linkCurrent, classNames?.item);

  if (permission.isDisabled) {
    // Shown, focusable and explained, but it goes nowhere.
    const button = (
      <AriaButton aria-disabled="true" aria-describedby={permission.reason ? reasonId : undefined} onPress={() => {}} className={cx(className, "cursor-not-allowed opacity-50")}>
        <ItemBody item={item} />
      </AriaButton>
    );
    return (
      <li>
        {permission.reason ? (
          <TooltipTrigger delay={300}>
            {button}
            <Tooltip>{permission.reason}</Tooltip>
          </TooltipTrigger>
        ) : (
          button
        )}
        {permission.reason && (
          <span id={reasonId} className="sr-only">
            {permission.reason}
          </span>
        )}
      </li>
    );
  }

  if (item.children?.length) {
    return (
      <li>
        <MenuTrigger>
          <AriaButton className={cx(className, "pe-2")}>
            <ItemBody item={item} />
            {isParentOfCurrent && <span className="sr-only">, current section</span>}
            <ChevronDownIcon className="size-4 shrink-0 text-[var(--rd-color-text-muted)]" />
          </AriaButton>
          <Menu aria-label={item.label} placement="bottom start" className={classNames?.dropdown}>
            {item.children.map((child) => {
              const access = navPermission(child);
              const isCurrent = currentId === child.id;
              return (
                <MenuItem
                  key={child.id}
                  id={child.id}
                  textValue={child.label}
                  href={access.isAllowed ? child.href : undefined}
                  isDisabled={access.isDisabled}
                  data-current={isCurrent || undefined}
                  onAction={access.isAllowed ? () => onNavigate?.(child) : undefined}
                  className={isCurrent ? "font-medium" : undefined}
                >
                  <span className="flex flex-col">
                    <span className="truncate">
                      {child.label}
                      {isCurrent && <span className="sr-only">, current page</span>}
                    </span>
                    {access.isDisabled && access.reason && <span className="truncate text-xs text-[var(--rd-color-text-muted)]">{access.reason}</span>}
                  </span>
                </MenuItem>
              );
            })}
          </Menu>
        </MenuTrigger>
      </li>
    );
  }

  const choose = () => onNavigate?.(item);
  if (renderLink) {
    return <li>{renderLink({ item, className, children: <ItemBody item={item} />, isCurrent: current, onClick: choose })}</li>;
  }
  return (
    <li>
      {item.href ? (
        <AriaLink href={item.href} aria-current={current ? "page" : undefined} onPress={choose} className={className}>
          <ItemBody item={item} />
        </AriaLink>
      ) : (
        <AriaButton aria-current={current ? "page" : undefined} onPress={choose} className={className}>
          <ItemBody item={item} />
        </AriaButton>
      )}
    </li>
  );
}

const variants = {
  plain: "bg-[var(--rd-color-surface-default)]",
  bordered: "border-b border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]",
  floating: "m-3 rounded-full border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] px-5 [box-shadow:var(--rd-elevation-raised)]",
} as const;

/**
 * Navigation across the top of an application or marketing site: your brand, links (some opening a
 * short list), and a slot for buttons or the account menu. In a narrow space it becomes a menu button
 * that opens the same links in a sheet. It has no router of its own: items are links (with `href`, or
 * through `renderLink` for your router) or buttons (with `onNavigate`).
 */
export const TopNav = forwardRef<HTMLDivElement, TopNavProps>(function TopNav(
  { brand, items, currentId, label = topNavDefaults.label, onNavigate, renderLink, actions, variant = topNavDefaults.variant, sticky = topNavDefaults.sticky, menuLabel = topNavDefaults.menuLabel, classNames, className },
  forwardedRef,
) {
  const root = useRef<HTMLDivElement | null>(null);
  // Narrow means the space the bar is in, not the screen.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < NARROW));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // What the app hides is not drawn, and a parent with nothing left to open goes too.
  const visible = visibleItems(items);
  const top = currentTopLevel([{ items: visible }], currentId);

  return (
    <div
      ref={(node) => {
        root.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      data-variant={variant}
      data-narrow={narrow || undefined}
      className={cx(
        "flex h-14 w-auto items-center gap-4 px-4 text-[var(--rd-color-text-default)] data-[narrow]:gap-2 data-[narrow]:px-2",
        variants[variant],
        sticky && (variant === "floating" ? "sticky top-3 z-30" : "sticky top-0 z-30"),
        className,
        classNames?.root,
      )}
    >
      {narrow && (
        <DialogTrigger>
          <AriaButton
            aria-label={menuLabel}
            className={cx("flex size-9 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] text-[var(--rd-color-text-default)] data-[hovered]:bg-[var(--rd-color-surface-subtle)]", focusRing, classNames?.["menu-button"])}
          >
            <MenuIcon className="size-5" />
          </AriaButton>
          <Sheet title={menuLabel} side="start" size="sm" className={classNames?.["menu-sheet"]}>
            {({ close }) => (
              <div className="-m-6 flex h-[calc(100%+3rem)] min-h-0 flex-col">
                <NavList groups={[{ items }]} currentId={currentId} collapsed={false} label={label} onNavigate={onNavigate} renderLink={renderLink} onPick={close} />
              </div>
            )}
          </Sheet>
        </DialogTrigger>
      )}
      {brand && <div className={cx("flex min-w-0 shrink items-center truncate text-[15px] font-semibold", classNames?.brand)}>{brand as ReactNode}</div>}
      {!narrow && (
        <nav aria-label={label} className={cx("flex min-w-0 flex-1 items-center", classNames?.nav)}>
          <ul className={cx("flex items-center gap-1", classNames?.list)}>
            {visible.map((item) => (
              <Entry key={item.id} item={item} currentId={currentId} onNavigate={onNavigate} renderLink={renderLink} classNames={classNames} isParentOfCurrent={top?.id === item.id && top.id !== currentId} />
            ))}
          </ul>
        </nav>
      )}
      {narrow && <div className="flex-1" />}
      {actions && <div className={cx("flex shrink-0 items-center", narrow ? "gap-1" : "gap-2", classNames?.actions)}>{actions}</div>}
    </div>
  );
});
