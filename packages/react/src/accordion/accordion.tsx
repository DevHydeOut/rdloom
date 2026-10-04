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
      className={cx("flex w-full flex-col divide-y divide-[var(--rd-color-border-default)] border-y border-[var(--rd-color-border-default)]", className)}
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
    <Disclosure {...rest} className={cx("group", className)}>
      <Heading level={headingLevel} className="m-0">
        <Button
          slot="trigger"
          className={cx(
            "flex w-full items-center justify-between gap-4 rounded-[var(--rd-radius-control)] py-4 text-start text-sm font-medium outline-none",
            "text-[var(--rd-color-text-default)] data-[hovered]:underline",
            "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
            "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[disabled]:no-underline",
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
      <DisclosurePanel className="pb-4 text-sm text-[var(--rd-color-text-muted)]">{children}</DisclosurePanel>
    </Disclosure>
  );
}
