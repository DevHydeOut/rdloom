"use client";

import { forwardRef, useId } from "react";
import { nativeSelectDefaults, type NativeSelectSpecProps } from "../generated/native-select.types";
import { cx } from "../utils/cx";
import { ChevronDownIcon } from "../utils/icons";

type Option = { value: string; label: string; disabled?: boolean };
type Group = { label: string; options: Option[] };

export interface NativeSelectProps
  extends NativeSelectSpecProps,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, keyof NativeSelectSpecProps | "size" | "className" | "disabled" | "required" | "multiple"> {
  className?: string;
}

const sizes: Record<NonNullable<NativeSelectSpecProps["size"]>, string> = {
  sm: "h-[var(--rd-size-control-sm)] ps-[var(--rd-space-control-x-sm)] text-sm",
  md: "h-[var(--rd-size-control-md)] ps-[var(--rd-space-control-x)] text-sm",
  lg: "h-[var(--rd-size-control-lg)] ps-[var(--rd-space-control-x-lg)] text-base",
};

function isGroup(o: Option | Group): o is Group {
  return "options" in o;
}

function renderOption(o: Option) {
  return (
    <option key={o.value} value={o.value} disabled={o.disabled}>
      {o.label}
    </option>
  );
}

/** The browser's own select, styled like the other fields. For custom option rows or search, use Select or Combobox. */
export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(function NativeSelect(
  {
    label,
    description,
    errorMessage,
    placeholder,
    size = nativeSelectDefaults.size,
    options,
    isDisabled = nativeSelectDefaults.isDisabled,
    isInvalid = nativeSelectDefaults.isInvalid,
    isRequired = nativeSelectDefaults.isRequired,
    children,
    className,
    id,
    value,
    defaultValue,
    "aria-describedby": describedByProp,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? `${autoId}-select`;
  const descId = `${autoId}-desc`;
  const errorId = `${autoId}-error`;
  const showError = isInvalid && !!errorMessage;
  const describedBy = [describedByProp, description ? descId : null, showError ? errorId : null].filter(Boolean).join(" ") || undefined;
  // A disabled empty first option only shows while nothing is chosen, so start on it.
  const startValue = value === undefined && defaultValue === undefined && placeholder ? "" : defaultValue;

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={selectId} className="text-sm font-medium text-[var(--rd-color-text-default)]">
        {label}
        {isRequired && <span aria-hidden="true" className="text-[var(--rd-color-feedback-danger)]"> *</span>}
      </label>
      <div className="relative">
        <select
          {...rest}
          ref={ref}
          id={selectId}
          value={value}
          defaultValue={value === undefined ? startValue : undefined}
          disabled={isDisabled}
          required={isRequired}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          className={cx(
            "peer block w-full appearance-none pe-9 outline-none transition-colors " +
              "bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] " +
              "border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-control)] [box-shadow:var(--rd-elevation-raised)] " +
              "hover:border-[var(--rd-color-border-strong)] " +
              "focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] focus-visible:border-[var(--rd-color-focus-ring)] " +
              "aria-[invalid=true]:border-[var(--rd-color-feedback-danger)] " +
              "disabled:opacity-50 disabled:cursor-not-allowed motion-reduce:transition-none",
            sizes[size],
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((o) =>
                isGroup(o) ? (
                  <optgroup key={o.label} label={o.label}>
                    {o.options.map(renderOption)}
                  </optgroup>
                ) : (
                  renderOption(o)
                ),
              )
            : children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center peer-disabled:opacity-50">
          <ChevronDownIcon />
        </span>
      </div>
      {description && (
        <p id={descId} className="text-xs text-[var(--rd-color-text-muted)]">
          {description}
        </p>
      )}
      {showError && (
        <p id={errorId} className="text-xs text-[var(--rd-color-feedback-danger)]">
          {errorMessage}
        </p>
      )}
    </div>
  );
});
