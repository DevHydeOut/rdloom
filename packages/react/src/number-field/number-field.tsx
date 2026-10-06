"use client";

import { forwardRef } from "react";
import {
  Button,
  FieldError,
  Group,
  Input,
  Label,
  NumberField as AriaNumberField,
  Text,
  type NumberFieldProps as AriaNumberFieldProps,
} from "react-aria-components";
import { numberFieldDefaults, type NumberFieldSpecProps } from "../generated/number-field.types";
import { cx } from "../utils/cx";
import { fieldGroup, fieldGroupSizes } from "../utils/field";
import { MinusIcon, PlusIcon } from "../utils/icons";

export interface NumberFieldProps
  extends NumberFieldSpecProps,
    Omit<AriaNumberFieldProps, keyof NumberFieldSpecProps | "className" | "children"> {
  className?: string;
}

const stepper =
  "flex size-7 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] text-[var(--rd-color-text-muted)] outline-none " +
  "data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] data-[pressed]:bg-[var(--rd-color-surface-subtle)] " +
  "data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

const heights = {
  sm: "h-[var(--rd-size-control-sm)]",
  md: "h-[var(--rd-size-control-md)]",
  lg: "h-[var(--rd-size-control-lg)]",
} as const;

export const NumberField = forwardRef<HTMLDivElement, NumberFieldProps>(function NumberField(
  {
    label,
    description,
    errorMessage,
    showStepper = numberFieldDefaults.showStepper,
    size = numberFieldDefaults.size,
    isDisabled = numberFieldDefaults.isDisabled,
    // Left undefined unless passed: React Aria treats any defined isInvalid as
    // controlled and would hide its own validation (min, max, required).
    isInvalid,
    isRequired = numberFieldDefaults.isRequired,
    step = numberFieldDefaults.step,
    className,
    ...rest
  },
  ref,
) {
  return (
    <AriaNumberField
      {...rest}
      ref={ref}
      step={step}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isRequired={isRequired}
      className={cx("flex flex-col gap-2", className)}
    >
      <Label className="text-sm font-medium text-[var(--rd-color-text-default)]">
        {label}
        {isRequired && <span aria-hidden="true" className="text-[var(--rd-color-feedback-danger)]"> *</span>}
      </Label>
      <Group className={cx(fieldGroup, fieldGroupSizes[size], heights[size], showStepper && "pe-1")}>
        <Input className="min-w-0 flex-1 bg-transparent tabular-nums outline-none" />
        {showStepper && (
          <>
            <Button slot="decrement" className={stepper}>
              <MinusIcon className="size-4" />
            </Button>
            <Button slot="increment" className={stepper}>
              <PlusIcon className="size-4" />
            </Button>
          </>
        )}
      </Group>
      {description && (
        <Text slot="description" className="text-xs text-[var(--rd-color-text-muted)]">
          {description}
        </Text>
      )}
      <FieldError className="text-xs text-[var(--rd-color-feedback-danger)]">{errorMessage}</FieldError>
    </AriaNumberField>
  );
});
