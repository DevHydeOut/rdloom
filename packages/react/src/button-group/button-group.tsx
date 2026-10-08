"use client";

import { Children, cloneElement, forwardRef, isValidElement, type HTMLAttributes, type ReactElement } from "react";
import { buttonGroupDefaults, type ButtonGroupSpecProps } from "../generated/button-group.types";
import { Button } from "../button/button";
import { cx } from "../utils/cx";

export interface ButtonGroupProps
  extends ButtonGroupSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof ButtonGroupSpecProps | "className" | "role" | "aria-label"> {
  className?: string;
}

// Every child is a direct flex item. The selectors with :not() are more specific than the
// radius class on Button, so the inner corners are flattened without touching Button.
const shared =
  "[&>*]:relative [&>*]:shrink-0 motion-reduce:[&>*]:transition-none " +
  "[&>*]:data-[hovered]:z-[1] [&>*]:data-[focus-visible]:z-[2]";

const orientations: Record<NonNullable<ButtonGroupSpecProps["orientation"]>, string> = {
  horizontal:
    "inline-flex flex-row " +
    "[&>:not(:first-child)]:-ms-px [&>:not(:first-child)]:rounded-s-none [&>:not(:last-child)]:rounded-e-none",
  vertical:
    "inline-flex flex-col items-stretch " +
    "[&>:not(:first-child)]:-mt-px [&>:not(:first-child)]:rounded-t-none [&>:not(:last-child)]:rounded-b-none",
};

/** Joins Buttons into one unit: shared borders, only the outer corners rounded. Role group, named by `label`. */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { label, orientation = buttonGroupDefaults.orientation, size, children, className, ...rest },
  ref,
) {
  // Only direct Buttons get the size. A Button inside a MenuTrigger sets its own.
  const items = size
    ? Children.map(children, (child) => {
        if (!isValidElement(child) || child.type !== Button) return child;
        const el = child as ReactElement<{ size?: string }>;
        return el.props.size ? child : cloneElement(el, { size });
      })
    : children;
  return (
    <div {...rest} ref={ref} role="group" aria-label={label} className={cx(orientations[orientation], shared, className)}>
      {items}
    </div>
  );
});
