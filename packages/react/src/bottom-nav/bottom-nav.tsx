"use client";

import { forwardRef, useId } from "react";
import { Button as AriaButton, Link as AriaLink, TooltipTrigger } from "react-aria-components";
import { bottomNavDefaults, type BottomNavSpecProps } from "../generated/bottom-nav.types";
import { badgeText, initialOf, navPermission, visibleItems, type NavItem } from "../sidebar/nav";
import { Tooltip } from "../tooltip/tooltip";
import { cx } from "../utils/cx";

export interface BottomNavProps extends BottomNavSpecProps {
  className?: string;
}

/** The parts of the tab bar that take a class name of their own. */
export type BottomNavSlot = "root" | "list" | "item" | "icon" | "label" | "badge";
export type BottomNavClassNames = Partial<Record<BottomNavSlot, string>>;

const focusRing = "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-inset data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

// Every tab is at least 44 by 44 px, and the tabs share the width equally.
const tabBase =
  "group relative flex min-h-12 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 pt-1.5 pb-1 text-[11px] leading-4 text-[var(--rd-color-text-muted)] " +
  "transition-colors data-[hovered]:text-[var(--rd-color-text-default)] motion-reduce:transition-none " +
  focusRing;
const tabCurrent = "font-semibold !text-[var(--rd-color-text-default)]";

interface TabProps extends Pick<BottomNavSpecProps, "onNavigate" | "renderLink"> {
  item: NavItem;
  current: boolean;
  labels: NonNullable<BottomNavSpecProps["labels"]>;
  classNames?: BottomNavClassNames;
}

function TabBody({ item, current, labels, classNames }: Pick<TabProps, "item" | "current" | "labels" | "classNames">) {
  const badge = badgeText(item.badge);
  // A hidden label is still the name of the tab.
  const showLabel = labels === "always" || (labels === "active" && current);
  return (
    <>
      <span
        aria-hidden="true"
        className={cx(
          "relative flex h-7 w-14 items-center justify-center rounded-full transition-colors motion-reduce:transition-none [&_svg]:size-5",
          current ? "bg-[var(--rd-color-surface-selected)]" : "group-data-[hovered]:bg-[var(--rd-color-surface-subtle)]",
          classNames?.icon,
        )}
      >
        {item.icon ?? <span className="text-xs font-semibold">{initialOf(item.label)}</span>}
        {badge && (
          <span
            className={cx(
              "absolute top-0 right-2.5 inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--rd-color-action-primary)] px-1 text-[10px] leading-4 font-semibold text-[var(--rd-color-surface-default)] tabular-nums",
              classNames?.badge,
            )}
          >
            {badge}
          </span>
        )}
      </span>
      <span className={cx(showLabel ? "max-w-full truncate" : "sr-only", classNames?.label)}>{item.label}</span>
      {badge && <span className="sr-only">, {badge}</span>}
    </>
  );
}

function Tab({ item, current, labels, onNavigate, renderLink, classNames }: TabProps) {
  const reasonId = useId();
  const permission = navPermission(item);
  const className = cx(tabBase, current && tabCurrent, classNames?.item);
  const body = <TabBody item={item} current={current} labels={labels} classNames={classNames} />;

  if (permission.isDisabled) {
    // Shown, focusable and explained, but it goes nowhere.
    const button = (
      <AriaButton aria-disabled="true" aria-describedby={permission.reason ? reasonId : undefined} onPress={() => {}} className={cx(className, "cursor-not-allowed opacity-50")}>
        {body}
      </AriaButton>
    );
    return (
      <li className="flex flex-1">
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

  const choose = () => onNavigate?.(item);
  if (renderLink) {
    return <li className="flex flex-1">{renderLink({ item, className, children: body, isCurrent: current, onClick: choose })}</li>;
  }
  return (
    <li className="flex flex-1">
      {item.href ? (
        <AriaLink href={item.href} aria-current={current ? "page" : undefined} onPress={choose} className={className}>
          {body}
        </AriaLink>
      ) : (
        <AriaButton aria-current={current ? "page" : undefined} onPress={choose} className={className}>
          {body}
        </AriaButton>
      )}
    </li>
  );
}

const variants = {
  plain: "border-t border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] pb-[env(safe-area-inset-bottom)]",
  floating:
    "mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] rounded-2xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] [box-shadow:var(--rd-elevation-raised)]",
} as const;

/**
 * A tab bar for the bottom of a phone-sized screen: a few main places, each with an icon and a short
 * label, the current one marked. It has no router of its own: items are links (with `href`, or through
 * `renderLink` for your router) or buttons (with `onNavigate`). The tabs are a list of links in a
 * navigation landmark, not a tablist, because they go to other places instead of switching panels.
 */
export const BottomNav = forwardRef<HTMLElement, BottomNavProps>(function BottomNav(
  { items, currentId, label = bottomNavDefaults.label, onNavigate, renderLink, labels = bottomNavDefaults.labels, variant = bottomNavDefaults.variant, fixed = bottomNavDefaults.fixed, classNames, className },
  ref,
) {
  // What the app hides is not drawn. A tab bar is one level, so sub-items are dropped.
  const visible = visibleItems(items).map((item) => (item.children ? { ...item, children: undefined } : item));
  return (
    <nav
      ref={ref}
      aria-label={label}
      data-variant={variant}
      data-labels={labels}
      className={cx("w-full text-[var(--rd-color-text-default)]", variants[variant], fixed && "fixed inset-x-0 bottom-0 z-30", fixed && variant === "floating" && "w-auto", className, classNames?.root)}
    >
      <ul className={cx("mx-auto flex max-w-lg items-stretch", classNames?.list)}>
        {visible.map((item) => (
          <Tab key={item.id} item={item} current={currentId === item.id} labels={labels} onNavigate={onNavigate} renderLink={renderLink} classNames={classNames} />
        ))}
      </ul>
    </nav>
  );
});
