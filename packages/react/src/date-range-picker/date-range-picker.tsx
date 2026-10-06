"use client";

import { useContext } from "react";
import {
  Button,
  DateInput,
  DateRangePicker as AriaDateRangePicker,
  DateRangePickerStateContext,
  DateSegment,
  Dialog,
  FieldError,
  Group,
  Label,
  Popover,
  Text,
  type DateRangePickerProps as AriaDateRangePickerProps,
  type DateValue,
} from "react-aria-components";
import { RangeCalendar } from "../calendar/calendar";
import { dateRangePickerDefaults, type DateRangePickerSpecProps } from "../generated/date-range-picker.types";
import { cx } from "../utils/cx";
import {
  fieldError,
  fieldGroup,
  fieldGroupSizes,
  fieldHelp,
  fieldLabel,
  iconButton,
  overlayPanel,
  segment,
} from "../utils/field";
import { CalendarIcon } from "../utils/icons";
import { useMediaQuery } from "../utils/use-media-query";
import { resolvePreset, type DateRangePreset } from "./presets";

export { defaultDateRangePresets, resolvePreset, type DateRangePreset } from "./presets";

// Generic like React Aria's, so value and onChange keep your date type.
export interface DateRangePickerProps<T extends DateValue = DateValue>
  extends Omit<DateRangePickerSpecProps, "value" | "defaultValue" | "onChange">,
    Omit<AriaDateRangePickerProps<T>, Exclude<keyof DateRangePickerSpecProps, "value" | "defaultValue" | "onChange"> | "className" | "children"> {
  className?: string;
}

interface PresetListProps {
  presets: DateRangePreset[];
  timeZone?: string;
  minValue?: DateValue;
  maxValue?: DateValue;
}

function PresetList({ presets, timeZone, minValue, maxValue }: PresetListProps) {
  // Reading the picker's state lets presets work in controlled and uncontrolled mode alike.
  const state = useContext(DateRangePickerStateContext)!;
  const current = state.value;

  return (
    // A wrapping row of chips above the calendar on phones, a side column from sm up.
    <div
      role="group"
      aria-label="Presets"
      className={
        "flex flex-wrap gap-1 border-b border-[var(--rd-color-border-default)] pb-3 " +
        "sm:min-w-36 sm:flex-col sm:flex-nowrap sm:gap-0.5 sm:border-b-0 sm:border-e sm:pb-0 sm:pe-3"
      }
    >
      {presets.map((preset) => {
        const range = resolvePreset(preset, timeZone);
        const outOfBounds =
          (minValue != null && range.start.compare(minValue) < 0) ||
          (maxValue != null && range.end.compare(maxValue) > 0);
        const isActive =
          current?.start != null &&
          current?.end != null &&
          range.start.compare(current.start) === 0 &&
          range.end.compare(current.end) === 0;

        return (
          <Button
            key={preset.id}
            isDisabled={outOfBounds}
            aria-pressed={isActive}
            onPress={() => {
              state.setValue(range);
              state.close();
            }}
            className={
              "rounded-[var(--rd-radius-control)] px-2.5 py-1.5 text-start text-sm outline-none " +
              "text-[var(--rd-color-text-default)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] " +
              "aria-pressed:bg-[var(--rd-color-surface-subtle)] aria-pressed:font-medium " +
              "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[disabled]:opacity-40"
            }
          >
            {preset.label}
          </Button>
        );
      })}
    </div>
  );
}

export function DateRangePicker<T extends DateValue = DateValue>({
  label,
  description,
  errorMessage,
  size = dateRangePickerDefaults.size,
  presets,
  timeZone,
  visibleMonths = dateRangePickerDefaults.visibleMonths,
  isDisabled = dateRangePickerDefaults.isDisabled,
  // Left undefined unless passed: React Aria treats any defined isInvalid as
  // controlled and would hide its own validation (required, min/max...).
  isInvalid,
  isRequired = dateRangePickerDefaults.isRequired,
  className,
  ...rest
}: DateRangePickerProps<T>) {
  // Two months side by side don't fit a phone, and stacking them makes the
  // popover taller than the screen. Show one month below the sm breakpoint.
  const isWide = useMediaQuery("(min-width: 640px)");
  const months = isWide ? visibleMonths : 1;

  return (
    <AriaDateRangePicker
      {...rest}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isRequired={isRequired}
      className={cx("group flex flex-col gap-2", className)}
    >
      <Label className={fieldLabel}>
        {label}
        {isRequired && <span aria-hidden="true" className="text-[var(--rd-color-feedback-danger)]"> *</span>}
      </Label>
      <Group className={cx(fieldGroup, fieldGroupSizes[size])}>
        <DateInput slot="start" className="flex">
          {(seg) => <DateSegment segment={seg} className={segment} />}
        </DateInput>
        <span aria-hidden="true" className="px-1 text-[var(--rd-color-text-muted)]">
          –
        </span>
        <DateInput slot="end" className="flex flex-1">
          {(seg) => <DateSegment segment={seg} className={segment} />}
        </DateInput>
        <Button className={iconButton}>
          <CalendarIcon />
        </Button>
      </Group>
      {description && (
        <Text slot="description" className={fieldHelp}>
          {description}
        </Text>
      )}
      <FieldError className={fieldError}>{errorMessage}</FieldError>
      <Popover className={cx(overlayPanel, "overflow-auto")}>
        <Dialog className="flex flex-col gap-3 p-3 outline-none sm:flex-row">
          {presets && presets.length > 0 && (
            <PresetList presets={presets} timeZone={timeZone} minValue={rest.minValue} maxValue={rest.maxValue} />
          )}
          <RangeCalendar visibleMonths={months} />
        </Dialog>
      </Popover>
    </AriaDateRangePicker>
  );
}
