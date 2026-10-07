"use client";

import type { ReactNode } from "react";
import {
  Button,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading,
  type DisclosureGroupProps,
  type DisclosureProps,
} from "react-aria-components";
import { accordionDefaults, type AccordionSpecProps } from "../generated/accordion.types";
import { cx } from "../utils/cx";
import { ChevronDownIcon } from "../utils/icons";

export interface AccordionProps
  extends AccordionSpecProps,
    Omit<DisclosureGroupProps, keyof AccordionSpecProps | "className" | "children"> {
  className?: string;
}

export function Accordion({
  allowsMultipleExpanded = accordionDefaults.allowsMultipleExpanded,
  isDisabled = accordionDefaults.isDisabled,
  children,
  className,
  ...rest
}: AccordionProps) {
  return (
    <DisclosureGroup
      {...rest}
      allowsMultipleExpanded={allowsMultipleExpanded}
      isDisabled={isDisabled}
      className={cx("flex w-full min-w-0 flex-col divide-y divide-[var(--rd-color-border-default)] overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] [box-shadow:var(--rd-elevation-raised)]", className)}
    >
      {children}
    </DisclosureGroup>
  );
}

export interface AccordionItemProps extends Omit<DisclosureProps, "className" | "children"> {
  /** The section heading; also the button's accessible name. */
  title: ReactNode;
  children: ReactNode;
  /** Heading level for the section headings. Match your page outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function AccordionItem({ title, children, headingLevel = 3, className, ...rest }: AccordionItemProps) {
  return (
    <Disclosure {...rest} className={cx("group first:rounded-t-[var(--rd-radius-overlay)] last:rounded-b-[var(--rd-radius-overlay)]", className)}>
      <Heading level={headingLevel} className="m-0">
        <Button
          slot="trigger"
          className={cx(
            "flex w-full items-center justify-between gap-4 px-4 py-3.5 text-start text-sm font-medium outline-none rounded-[inherit] group-data-[expanded]:rounded-b-none",
            "text-[var(--rd-color-text-default)] data-[hovered]:bg-[var(--rd-color-surface-subtle)]",
            "data-[focus-visible]:ring-2 data-[focus-visible]:ring-inset data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
            "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[disabled]:bg-transparent",
          )}
        >
          {title}
          <span
            aria-hidden="true"
            className="shrink-0 text-[var(--rd-color-text-muted)] transition-transform duration-200 group-data-[expanded]:rotate-180 motion-reduce:transition-none"
          >
            <ChevronDownIcon />
          </span>
        </Button>
      </Heading>
      <DisclosurePanel className="h-[var(--disclosure-panel-height)] overflow-clip text-sm text-[var(--rd-color-text-default)] transition-[height] duration-200 ease-out motion-reduce:transition-none">
        <div className="px-4 pb-4 opacity-0 transition-opacity duration-200 group-data-[expanded]:opacity-100 motion-reduce:transition-none">{children}</div>
      </DisclosurePanel>
    </Disclosure>
  );
}
