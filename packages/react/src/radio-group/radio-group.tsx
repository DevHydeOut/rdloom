"use client";

import { forwardRef } from "react";
import {
  FieldError,
  Label,
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
  Text,
  type RadioGroupProps as AriaRadioGroupProps,
  type RadioProps as AriaRadioProps,
} from "react-aria-components";
import { radioGroupDefaults, type RadioGroupSpecProps } from "../generated/radio-group.types";
import { cx } from "../utils/cx";

export interface RadioGroupProps
  extends RadioGroupSpecProps,
    Omit<AriaRadioGroupProps, keyof RadioGroupSpecProps | "className" | "children"> {
  className?: string;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  {
    label,
    description,
    errorMessage,
    orientation = radioGroupDefaults.orientation,
    isDisabled = radioGroupDefaults.isDisabled,
    // Left undefined unless passed: React Aria treats any defined isInvalid as
    // controlled and would hide its own validation (required, min/max...).
    isInvalid,
    isRequired = radioGroupDefaults.isRequired,
    children,
    className,
    ...rest
  },
  ref,
) {
  return (
    <AriaRadioGroup
      {...rest}
      ref={ref}
      orientation={orientation}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isRequired={isRequired}
      className={cx("flex flex-col gap-2", className)}
    >
      <Label className="text-sm font-medium text-[var(--rd-color-text-default)]">
        {label}
        {isRequired && <span aria-hidden="true" className="text-[var(--rd-color-feedback-danger)]"> *</span>}
      </Label>
      <div className={cx("flex gap-2", orientation === "horizontal" ? "flex-row flex-wrap gap-x-5" : "flex-col")}>
        {children}
      </div>
      {description && (
        <Text slot="description" className="text-xs text-[var(--rd-color-text-muted)]">
          {description}
        </Text>
      )}
      <FieldError className="text-xs text-[var(--rd-color-feedback-danger)]">{errorMessage}</FieldError>
    </AriaRadioGroup>
  );
});

export interface RadioProps extends Omit<AriaRadioProps, "className" | "children"> {
  className?: string;
  children: React.ReactNode;
}

export const Radio = forwardRef<HTMLLabelElement, RadioProps>(function Radio({ className, children, ...rest }, ref) {
  return (
    <AriaRadio
      {...rest}
      ref={ref}
      className={cx(
        "group inline-flex items-center gap-2 text-sm text-[var(--rd-color-text-default)] cursor-pointer " +
          "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={
          "size-4 shrink-0 rounded-full border transition-[border-width,border-color] " +
          "border-[var(--rd-color-border-strong)] bg-[var(--rd-color-surface-default)] " +
          "group-data-[selected]:border-[5px] group-data-[selected]:border-[var(--rd-color-action-primary)] " +
          "group-data-[invalid]:border-[var(--rd-color-feedback-danger)] " +
          "group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-offset-2 group-data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
        }
      />
      {children}
    </AriaRadio>
  );
});
