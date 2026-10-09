"use client";

import { forwardRef } from "react";
import {
  DateInput,
  DateSegment,
  FieldError,
  Label,
  Text,
  TimeField as AriaTimeField,
  type TimeFieldProps as AriaTimeFieldProps,
  type TimeValue,
} from "react-aria-components";
import { timeFieldDefaults, type TimeFieldSpecProps } from "../generated/time-field.types";
import { cx } from "../utils/cx";
import { fieldGroup, fieldGroupSizes, segment, tidySegment } from "../utils/field";

export interface TimeFieldProps
  extends TimeFieldSpecProps,
    Omit<AriaTimeFieldProps<TimeValue>, keyof TimeFieldSpecProps | "className" | "children"> {
  className?: string;
}

export const TimeField = forwardRef<HTMLDivElement, TimeFieldProps>(function TimeField(
  {
    label,
    description,
    errorMessage,
    granularity = timeFieldDefaults.granularity,
    size = timeFieldDefaults.size,
    isDisabled = timeFieldDefaults.isDisabled,
    // Left undefined unless passed: React Aria treats any defined isInvalid as
    // controlled and would hide its own validation (min and max times, required).
    isInvalid,
    isRequired = timeFieldDefaults.isRequired,
    className,
    ...rest
  },
  ref,
) {
  return (
    <AriaTimeField
      {...rest}
      ref={ref}
      granularity={granularity}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isRequired={isRequired}
      className={cx("flex flex-col gap-2", className)}
    >
      <Label className="text-sm font-medium text-[var(--rd-color-text-default)]">
        {label}
        {isRequired && <span aria-hidden="true" className="text-[var(--rd-color-feedback-danger)]"> *</span>}
      </Label>
      <DateInput className={cx(fieldGroup, fieldGroupSizes[size], "tabular-nums")}>
        {(seg) => <DateSegment segment={tidySegment(seg)} className={segment} />}
      </DateInput>
      {description && (
        <Text slot="description" className="text-xs text-[var(--rd-color-text-muted)]">
          {description}
        </Text>
      )}
      <FieldError className="text-xs text-[var(--rd-color-feedback-danger)]">{errorMessage}</FieldError>
    </AriaTimeField>
  );
});
