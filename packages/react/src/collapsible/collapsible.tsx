"use client";

import { Button, Disclosure, DisclosurePanel, type DisclosureProps } from "react-aria-components";
import { collapsibleDefaults, type CollapsibleSpecProps } from "../generated/collapsible.types";
import { cx } from "../utils/cx";
import { ChevronDownIcon } from "../utils/icons";

export interface CollapsibleProps
  extends CollapsibleSpecProps,
    Omit<DisclosureProps, keyof CollapsibleSpecProps | "defaultExpanded" | "className" | "children" | "title"> {
  className?: string;
}

/** One region that opens and closes. For a group of sections where opening one can close the others, use Accordion. */
export function Collapsible({
  title,
  summary,
  defaultExpanded = collapsibleDefaults.defaultExpanded,
  isExpanded,
  onExpandedChange,
  isDisabled = collapsibleDefaults.isDisabled,
  children,
  className,
  ...rest
}: CollapsibleProps) {
  return (
    <Disclosure
      {...rest}
      defaultExpanded={defaultExpanded}
      isExpanded={isExpanded}
      onExpandedChange={onExpandedChange}
      isDisabled={isDisabled}
      className={cx("group w-full rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)]", className)}
    >
      <Button
        slot="trigger"
        className={cx(
          "flex w-full items-center justify-between gap-4 rounded-[inherit] px-4 py-3 text-start outline-none",
          "text-[var(--rd-color-text-default)] data-[hovered]:bg-[var(--rd-color-surface-subtle)]",
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-inset data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
          "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[disabled]:bg-transparent",
        )}
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">{title}</span>
          {summary ? <span className="text-sm text-[var(--rd-color-text-muted)]">{summary}</span> : null}
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 text-[var(--rd-color-text-muted)] transition-transform duration-200 group-data-[expanded]:rotate-180 motion-reduce:transition-none"
        >
          <ChevronDownIcon />
        </span>
      </Button>
      <DisclosurePanel className="h-[var(--disclosure-panel-height)] overflow-clip text-sm text-[var(--rd-color-text-default)] transition-[height] duration-200 motion-reduce:transition-none">
        <div className="px-4 pb-4">{children}</div>
      </DisclosurePanel>
    </Disclosure>
  );
}
