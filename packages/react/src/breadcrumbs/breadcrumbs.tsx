"use client";

import { createContext, forwardRef, useContext, type ReactNode } from "react";
import { Breadcrumb, Breadcrumbs as AriaBreadcrumbs, Button as AriaButton, Link } from "react-aria-components";
import { breadcrumbsDefaults, type BreadcrumbsSpecProps } from "../generated/breadcrumbs.types";
import { Menu, MenuItem, MenuTrigger } from "../menu/menu";
import { cx } from "../utils/cx";
import { ChevronRightIcon, DotsIcon } from "../utils/icons";

export interface BreadcrumbsProps extends BreadcrumbsSpecProps {
  className?: string;
}

type Separator = NonNullable<BreadcrumbsSpecProps["separator"]>;

const SeparatorContext = createContext<Separator>("chevron");

export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(
  {
    children,
    label = breadcrumbsDefaults.label,
    separator = breadcrumbsDefaults.separator,
    isDisabled = breadcrumbsDefaults.isDisabled,
    className,
  },
  ref,
) {
  // React Aria renders the ordered list; the navigation landmark around it is ours.
  return (
    <SeparatorContext.Provider value={separator}>
      <nav ref={ref} aria-label={label} className={className}>
        <AriaBreadcrumbs isDisabled={isDisabled} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {children}
        </AriaBreadcrumbs>
      </nav>
    </SeparatorContext.Provider>
  );
});

// Decorative: the list already says there are several items. The last one has none.
function SeparatorMark({ custom }: { custom?: ReactNode }) {
  const kind = useContext(SeparatorContext);
  const cls = "shrink-0 text-[var(--rd-color-text-muted)] group-data-[current]:hidden";
  if (custom) {
    return (
      <span aria-hidden="true" className={cx(cls, "inline-flex items-center")}>
        {custom}
      </span>
    );
  }
  if (kind === "slash") {
    return (
      <span aria-hidden="true" className={cx(cls, "select-none")}>
        /
      </span>
    );
  }
  return <ChevronRightIcon className={cx("size-3.5", cls, "rtl:-scale-x-100")} />;
}

const linkClass =
  "rounded-[var(--rd-radius-control)] outline-none " +
  "text-[var(--rd-color-text-muted)] underline-offset-4 data-[hovered]:text-[var(--rd-color-text-default)] data-[hovered]:underline " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[focus-visible]:ring-offset-2 " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 " +
  "data-[current]:font-medium data-[current]:text-[var(--rd-color-text-default)] data-[current]:no-underline";

export interface BreadcrumbItemProps {
  /** Where this step goes. Leave it out on the last item: that is the current page, which is not a link. */
  href?: string;
  children: ReactNode;
  /** A small icon before the text, for example a house for the home step. Decorative: the text names the step. */
  icon?: ReactNode;
  /** Replaces the separator after this one item. */
  separator?: ReactNode;
  className?: string;
}

export function BreadcrumbItem({ href, children, icon, separator, className }: BreadcrumbItemProps) {
  return (
    <Breadcrumb className={cx("group flex min-w-0 items-center gap-2", className)}>
      <Link href={href} className={cx(linkClass, icon ? "inline-flex min-w-0 items-center gap-1.5" : "block min-w-0 truncate")}>
        {icon ? (
          <>
            <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-4">
              {icon}
            </span>
            <span className="truncate">{children}</span>
          </>
        ) : (
          children
        )}
      </Link>
      <SeparatorMark custom={separator} />
    </Breadcrumb>
  );
}

export interface BreadcrumbCollapsedItem {
  label: string;
  href?: string;
}

export interface BreadcrumbEllipsisProps {
  /** The steps that are hidden. They open from a menu, in trail order. */
  items: BreadcrumbCollapsedItem[];
  /** Accessible name of the button that opens the hidden steps. Translate it for other languages. */
  label?: string;
  /** Replaces the separator after the ellipsis. */
  separator?: ReactNode;
  className?: string;
}

/** Stands in for the middle of a long trail. Put it between the first and the last few BreadcrumbItems. */
export function BreadcrumbEllipsis({ items, label = "Show hidden pages", separator, className }: BreadcrumbEllipsisProps) {
  return (
    <Breadcrumb className={cx("group flex items-center gap-2", className)}>
      <MenuTrigger>
        <AriaButton
          aria-label={label}
          className={cx(
            "inline-flex size-6 items-center justify-center rounded-[var(--rd-radius-control)] outline-none transition-colors motion-reduce:transition-none",
            "text-[var(--rd-color-text-muted)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)]",
            "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[focus-visible]:ring-offset-2",
          )}
        >
          <DotsIcon className="size-4 rotate-90" />
        </AriaButton>
        <Menu placement="bottom start" aria-label={label}>
          {items.map((item) => (
            <MenuItem key={`${item.href ?? ""}${item.label}`} href={item.href}>
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </MenuTrigger>
      <SeparatorMark custom={separator} />
    </Breadcrumb>
  );
}
