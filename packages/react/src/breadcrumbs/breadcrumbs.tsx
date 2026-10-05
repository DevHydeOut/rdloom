"use client";

import { forwardRef, type ReactNode } from "react";
import { Breadcrumb, Breadcrumbs as AriaBreadcrumbs, Link } from "react-aria-components";
import { breadcrumbsDefaults, type BreadcrumbsSpecProps } from "../generated/breadcrumbs.types";
import { cx } from "../utils/cx";

export interface BreadcrumbsProps extends BreadcrumbsSpecProps {
  className?: string;
}

export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(
  { children, label = breadcrumbsDefaults.label, isDisabled = breadcrumbsDefaults.isDisabled, className },
  ref,
) {
  // React Aria renders the ordered list; the navigation landmark around it is ours.
  return (
    <nav ref={ref} aria-label={label} className={className}>
      <AriaBreadcrumbs isDisabled={isDisabled} className="flex flex-wrap items-center gap-1.5 text-sm">
        {children}
      </AriaBreadcrumbs>
    </nav>
  );
});

export interface BreadcrumbItemProps {
  /** Where this step goes. Leave it out on the last item: that is the current page, which is not a link. */
  href?: string;
  children: ReactNode;
  className?: string;
}

export function BreadcrumbItem({ href, children, className }: BreadcrumbItemProps) {
  return (
    <Breadcrumb className={cx("group flex items-center gap-1.5", className)}>
      <Link
        href={href}
        className={
          "rounded-[var(--rd-radius-control)] outline-none " +
          "text-[var(--rd-color-text-muted)] underline-offset-2 data-[hovered]:text-[var(--rd-color-text-default)] data-[hovered]:underline " +
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] " +
          "data-[current]:font-medium data-[current]:text-[var(--rd-color-text-default)] data-[current]:no-underline"
        }
      >
        {children}
      </Link>
      {/* Decorative: the list already says there are several items. The last one has none. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-3.5 shrink-0 text-[var(--rd-color-text-muted)] group-data-[current]:hidden rtl:-scale-x-100"
        fill="none"
      >
        <path d="M6 3.5l4.5 4.5L6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Breadcrumb>
  );
}
