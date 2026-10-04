import {
  Button,
  DateInput,
  DatePicker as AriaDatePicker,
  DateSegment,
  Dialog,
  FieldError,
  Group,
  Label,
  Popover,
  Text,
  type DatePickerProps as AriaDatePickerProps,
  type DateValue,
} from "react-aria-components";
import { Calendar } from "../calendar/calendar";
import { datePickerDefaults, type DatePickerSpecProps } from "../generated/date-picker.types";
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

// Generic like React Aria's, so value and onChange keep your date type:
// useState<CalendarDate | null> works without casts.
export interface DatePickerProps<T extends DateValue = DateValue>
  extends Omit<DatePickerSpecProps, "value" | "defaultValue" | "onChange">,
    Omit<AriaDatePickerProps<T>, Exclude<keyof DatePickerSpecProps, "value" | "defaultValue" | "onChange"> | "className" | "children"> {
  className?: string;
}

export function DatePicker<T extends DateValue = DateValue>({
  label,
  description,
  errorMessage,
  size = datePickerDefaults.size,
  granularity = datePickerDefaults.granularity,
  isDisabled = datePickerDefaults.isDisabled,
  // Left undefined unless passed: React Aria treats any defined isInvalid as
  // controlled and would hide its own validation (required, min/max...).
  isInvalid,
  isRequired = datePickerDefaults.isRequired,
  className,
  ...rest
}: DatePickerProps<T>) {
  return (
    <AriaDatePicker
      {...rest}
      granularity={granularity}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isRequired={isRequired}
      className={cx("group flex flex-col gap-1.5", className)}
    >
      <Label className={fieldLabel}>
        {label}
        {isRequired && <span aria-hidden="true" className="text-[var(--rd-color-feedback-danger)]"> *</span>}
      </Label>
      <Group className={cx(fieldGroup, fieldGroupSizes[size])}>
        <DateInput className="flex flex-1">{(seg) => <DateSegment segment={seg} className={segment} />}</DateInput>
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
        <Dialog className="p-3 outline-none">
          <Calendar />
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );
}
