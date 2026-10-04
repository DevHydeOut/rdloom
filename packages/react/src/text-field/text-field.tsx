import { forwardRef } from "react";
import {
  FieldError,
  Input,
  Label,
  Text,
  TextArea,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";
import { textFieldDefaults, type TextFieldSpecProps } from "../generated/text-field.types";
import { cx } from "../utils/cx";

export interface TextFieldProps
  extends TextFieldSpecProps,
    Omit<AriaTextFieldProps, keyof TextFieldSpecProps | "className" | "children"> {
  className?: string;
}

const control =
  "w-full bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] " +
  "border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-control)] outline-none transition-colors " +
  "placeholder:text-[var(--rd-color-text-muted)] " +
  "data-[hovered]:border-[var(--rd-color-border-strong)] " +
  "data-[focused]:ring-2 data-[focused]:ring-[var(--rd-color-focus-ring)] data-[focused]:border-transparent " +
  "data-[invalid]:border-[var(--rd-color-feedback-danger)] " +
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed";

const sizes: Record<NonNullable<TextFieldSpecProps["size"]>, string> = {
  sm: "px-2.5 text-sm",
  md: "px-3 text-sm",
  lg: "px-3.5 text-base",
};
const heights: Record<NonNullable<TextFieldSpecProps["size"]>, string> = { sm: "h-8", md: "h-10", lg: "h-12" };

export const TextField = forwardRef<HTMLDivElement, TextFieldProps>(function TextField(
  {
    label,
    description,
    errorMessage,
    placeholder,
    size = textFieldDefaults.size,
    multiline = textFieldDefaults.multiline,
    isDisabled = textFieldDefaults.isDisabled,
    // Left undefined unless passed: React Aria treats any defined isInvalid as
    // controlled and would hide its own validation (required, min/max...).
    isInvalid,
    isRequired = textFieldDefaults.isRequired,
    className,
    ...rest
  },
  ref,
) {
  return (
    <AriaTextField
      {...rest}
      ref={ref}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isRequired={isRequired}
      className={cx("flex flex-col gap-1.5", className)}
    >
      <Label className="text-sm font-medium text-[var(--rd-color-text-default)]">
        {label}
        {isRequired && <span aria-hidden="true" className="text-[var(--rd-color-feedback-danger)]"> *</span>}
      </Label>
      {multiline ? (
        <TextArea placeholder={placeholder} className={cx(control, sizes[size], "min-h-24 py-2 resize-y")} />
      ) : (
        <Input placeholder={placeholder} className={cx(control, sizes[size], heights[size])} />
      )}
      {description && (
        <Text slot="description" className="text-xs text-[var(--rd-color-text-muted)]">
          {description}
        </Text>
      )}
      <FieldError className="text-xs text-[var(--rd-color-feedback-danger)]">{errorMessage}</FieldError>
    </AriaTextField>
  );
});
