"use client";

import { forwardRef } from "react";
import { Checkbox as AriaCheckbox, type CheckboxProps as AriaCheckboxProps } from "react-aria-components";
import { checkboxDefaults, type CheckboxSpecProps } from "../generated/checkbox.types";
import { cx } from "../utils/cx";

export interface CheckboxProps
  extends CheckboxSpecProps,
    Omit<AriaCheckboxProps, keyof CheckboxSpecProps | "className" | "children"> {
  className?: string;
}

// The box reacts to state on the parent label via `group-data-[...]`.
const box =
  "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors " +
  "border-[var(--rd-color-border-strong)] bg-[var(--rd-color-surface-default)] text-[var(--rd-color-action-on-primary)] " +
  "group-data-[selected]:bg-[var(--rd-color-action-primary)] group-data-[selected]:border-[var(--rd-color-action-primary)] " +
  "group-data-[indeterminate]:bg-[var(--rd-color-action-primary)] group-data-[indeterminate]:border-[var(--rd-color-action-primary)] " +
  "group-data-[invalid]:border-[var(--rd-color-feedback-danger)] " +
  "group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-offset-2 group-data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

export const Checkbox = forwardRef<HTMLLabelElement, CheckboxProps>(function Checkbox(
  {
    children,
    defaultSelected = checkboxDefaults.defaultSelected,
    isIndeterminate = checkboxDefaults.isIndeterminate,
    isDisabled = checkboxDefaults.isDisabled,
    // Left undefined unless passed: React Aria treats any defined isInvalid as
    // controlled and would hide its own validation (required, min/max...).
    isInvalid,
    className,
    ...rest
  },
  ref,
) {
  return (
    <AriaCheckbox
      {...rest}
      ref={ref}
      defaultSelected={defaultSelected}
      isIndeterminate={isIndeterminate}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      className={cx(
        "group inline-flex items-center gap-2 text-sm text-[var(--rd-color-text-default)] cursor-pointer " +
          "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
        className,
      )}
    >
      {({ isSelected, isIndeterminate: mixed }) => (
        <>
          <span className={box} aria-hidden="true">
            {mixed ? (
              <svg viewBox="0 0 16 16" className="size-3" fill="none">
                <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : isSelected ? (
              <svg viewBox="0 0 16 16" className="size-3" fill="none">
                <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </span>
          {children}
        </>
      )}
    </AriaCheckbox>
  );
});
