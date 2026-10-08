"use client";

import { forwardRef, useState, type SyntheticEvent } from "react";
import {
  FieldError,
  Input,
  Label,
  Text,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";
import { inputOTPDefaults, type InputOTPSpecProps } from "../generated/input-otp.types";
import { cx } from "../utils/cx";

export interface InputOTPProps
  extends InputOTPSpecProps,
    Omit<AriaTextFieldProps, keyof InputOTPSpecProps | "className" | "children" | "type" | "isRequired"> {
  className?: string;
}

const cell =
  "relative flex h-[var(--rd-size-control-lg)] w-[var(--rd-size-control-md)] min-w-0 shrink items-center justify-center text-base font-medium " +
  "bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] border border-[var(--rd-color-border-default)] " +
  "rounded-[var(--rd-radius-control)] [box-shadow:var(--rd-elevation-raised)] transition-colors " +
  "data-[active]:border-[var(--rd-color-focus-ring)] data-[active]:ring-2 data-[active]:ring-[var(--rd-color-focus-ring)] " +
  "data-[invalid]:border-[var(--rd-color-feedback-danger)]";

function clean(raw: string, type: "numeric" | "alphanumeric", length: number) {
  const pattern = type === "numeric" ? /[^0-9]/g : /[^a-zA-Z0-9]/g;
  return raw.replace(pattern, "").slice(0, length);
}

export const InputOTP = forwardRef<HTMLDivElement, InputOTPProps>(function InputOTP(
  {
    label,
    description,
    errorMessage,
    length = inputOTPDefaults.length,
    type = inputOTPDefaults.type,
    value,
    defaultValue,
    onChange,
    onComplete,
    separatorAt,
    mask = inputOTPDefaults.mask,
    autoFocus = inputOTPDefaults.autoFocus,
    isDisabled = inputOTPDefaults.isDisabled,
    isInvalid,
    className,
    ...rest
  },
  ref,
) {
  const [inner, setInner] = useState(() => clean(defaultValue ?? "", type, length));
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  const current = value != null ? clean(value, type, length) : inner;
  const active = Math.min(caret, current.length, length - 1);

  function change(raw: string) {
    const next = clean(raw, type, length);
    if (next === current) return;
    if (value == null) setInner(next);
    onChange?.(next);
    if (next.length === length) onComplete?.(next);
  }

  function track(event: SyntheticEvent<HTMLInputElement>) {
    setCaret(event.currentTarget.selectionStart ?? current.length);
  }

  const separators = new Set(separatorAt ?? []);

  return (
    <AriaTextField
      {...rest}
      ref={ref}
      value={current}
      onChange={change}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      className={cx("flex flex-col gap-2", className)}
    >
      <Label className="text-sm font-medium text-[var(--rd-color-text-default)]">{label}</Label>
      <div role="group" aria-label={label} className="relative inline-flex w-fit max-w-full items-center gap-2">
        {Array.from({ length }, (_, index) => {
          const char = current[index];
          const isActive = focused && index === active;
          return (
            <span key={index} className="contents">
              <span
                aria-hidden="true"
                data-active={isActive || undefined}
                data-invalid={isInvalid || undefined}
                data-filled={char ? "" : undefined}
                className={cx(cell, isDisabled && "opacity-50 cursor-not-allowed")}
              >
                {char ? (
                  mask ? (
                    <span className="size-2 rounded-full bg-[var(--rd-color-text-default)]" />
                  ) : (
                    char
                  )
                ) : (
                  isActive && <span className="h-5 w-px animate-pulse bg-[var(--rd-color-text-default)]" />
                )}
              </span>
              {separators.has(index + 1) && index + 1 < length && (
                <span aria-hidden="true" data-separator="" className="h-px w-3 bg-[var(--rd-color-border-strong)]" />
              )}
            </span>
          );
        })}
        <Input
          type={mask ? "password" : "text"}
          inputMode={type === "numeric" ? "numeric" : "text"}
          autoComplete="one-time-code"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          pattern={type === "numeric" ? "[0-9]*" : undefined}
          onFocus={(event) => {
            setFocused(true);
            track(event);
          }}
          onBlur={() => setFocused(false)}
          onSelect={track}
          onKeyUp={track}
          onClick={track}
          className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none selection:bg-transparent disabled:cursor-not-allowed"
        />
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {focused ? `Digit ${active + 1} of ${length}` : ""}
      </span>
      {description && (
        <Text slot="description" className="text-xs text-[var(--rd-color-text-muted)]">
          {description}
        </Text>
      )}
      <FieldError className="text-xs text-[var(--rd-color-feedback-danger)]">{errorMessage}</FieldError>
    </AriaTextField>
  );
});
