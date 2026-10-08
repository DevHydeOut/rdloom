"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  FieldError,
  Input,
  Label,
  Text,
  TextField as AriaTextField,
  type InputProps as AriaInputProps,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";
import { inputGroupDefaults, type InputGroupSpecProps } from "../generated/input-group.types";
import { cx } from "../utils/cx";

type Size = NonNullable<InputGroupSpecProps["size"]>;

interface GroupContext {
  size: Size;
  register: (id: string) => () => void;
}

const Ctx = createContext<GroupContext>({ size: "md", register: () => () => {} });

export interface InputGroupProps
  extends InputGroupSpecProps,
    Omit<AriaTextFieldProps, keyof InputGroupSpecProps | "className" | "children"> {
  className?: string;
}

const box =
  "flex w-full items-stretch rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] " +
  "bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] [box-shadow:var(--rd-elevation-raised)] " +
  "transition-colors motion-reduce:transition-none " +
  "hover:border-[var(--rd-color-border-strong)] " +
  "focus-within:border-[var(--rd-color-focus-ring)] focus-within:ring-2 focus-within:ring-[var(--rd-color-focus-ring)] " +
  "group-data-[invalid]/ig:border-[var(--rd-color-feedback-danger)] group-data-[invalid]/ig:focus-within:ring-[var(--rd-color-feedback-danger)] " +
  "group-data-[disabled]/ig:opacity-50 group-data-[disabled]/ig:cursor-not-allowed group-data-[disabled]/ig:hover:border-[var(--rd-color-border-default)]";

const heights: Record<Size, string> = {
  sm: "h-[var(--rd-size-control-sm)] text-sm",
  md: "h-[var(--rd-size-control-md)] text-sm",
  lg: "h-[var(--rd-size-control-lg)] text-base",
};

/**
 * A text field whose border wraps the input and its addons. It reuses the label, description and
 * error pieces of TextField, so naming, validation and `aria-describedby` work the same way.
 * Text addons are added to `aria-describedby` of the input, so "USD" or "https://" is read after the label.
 */
export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(function InputGroup(
  {
    label,
    description,
    errorMessage,
    size = inputGroupDefaults.size,
    isDisabled = inputGroupDefaults.isDisabled,
    // Left undefined unless passed, so React Aria keeps its own validation.
    isInvalid,
    isRequired = inputGroupDefaults.isRequired,
    isReadOnly = inputGroupDefaults.isReadOnly,
    className,
    children,
    ...rest
  },
  ref,
) {
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const register = useCallback((id: string) => {
    setAddonIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    return () => setAddonIds((ids) => ids.filter((x) => x !== id));
  }, []);
  const ctx = useMemo(() => ({ size, register }), [size, register]);
  const describedBy = [rest["aria-describedby"], ...addonIds].filter(Boolean).join(" ") || undefined;

  return (
    <AriaTextField
      {...rest}
      aria-describedby={describedBy}
      ref={ref}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isRequired={isRequired}
      isReadOnly={isReadOnly}
      className={cx("group/ig flex flex-col gap-2", className)}
    >
      <Label className="text-sm font-medium text-[var(--rd-color-text-default)]">
        {label}
        {isRequired && <span aria-hidden="true" className="text-[var(--rd-color-feedback-danger)]"> *</span>}
      </Label>
      <Ctx.Provider value={ctx}>
        <div className={cx(box, heights[size])}>{children}</div>
      </Ctx.Provider>
      {description && (
        <Text slot="description" className="text-xs text-[var(--rd-color-text-muted)]">
          {description}
        </Text>
      )}
      <FieldError className="text-xs text-[var(--rd-color-feedback-danger)]">{errorMessage}</FieldError>
    </AriaTextField>
  );
});

export interface InputGroupInputProps extends Omit<AriaInputProps, "className"> {
  className?: string;
}

const inputPadding: Record<Size, string> = {
  sm: "px-[var(--rd-space-control-x-sm)]",
  md: "px-[var(--rd-space-control-x)]",
  lg: "px-[var(--rd-space-control-x-lg)]",
};

/** The input inside an InputGroup: no border of its own, it fills the space between the addons. */
export const InputGroupInput = forwardRef<HTMLInputElement, InputGroupInputProps>(function InputGroupInput(
  { className, ...rest },
  ref,
) {
  const { size } = useContext(Ctx);
  return (
    <Input
      {...rest}
      ref={ref}
      className={cx(
        "min-w-0 flex-1 bg-transparent text-[inherit] outline-none placeholder:text-[var(--rd-color-text-muted)] disabled:cursor-not-allowed",
        inputPadding[size],
        className,
      )}
    />
  );
});

export interface InputGroupAddonProps extends Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> {
  className?: string;
  children: ReactNode;
  /** Side the addon sits on. It sets the divider; place it before or after the input in the markup to match. */
  align?: "start" | "end";
  /**
   * text: a unit or prefix, read with the field. icon: decorative, hidden from assistive technology.
   * button: holds a Button (usually ghost, size sm) that keeps its own name.
   */
  type?: "text" | "icon" | "button";
}

const addonBase = "flex shrink-0 items-center self-stretch";
const addonTypes = {
  text:
    "bg-[var(--rd-color-surface-subtle)] px-3 text-[var(--rd-color-text-muted)] whitespace-nowrap " +
    "first:rounded-s-[calc(var(--rd-radius-control)-1px)] last:rounded-e-[calc(var(--rd-radius-control)-1px)]",
  icon: "px-3 text-[var(--rd-color-text-muted)]",
  button: "px-1 [&_button[data-focus-visible]]:ring-offset-0",
};
const dividers = {
  start: "border-e border-e-[var(--rd-color-border-default)]",
  end: "border-s border-s-[var(--rd-color-border-default)]",
};

/** Text, an icon or a button placed inside the border of an InputGroup. */
export const InputGroupAddon = forwardRef<HTMLDivElement, InputGroupAddonProps>(function InputGroupAddon(
  { align = "start", type = "text", className, children, id, ...rest },
  ref,
) {
  const autoId = useId();
  const addonId = id ?? autoId;
  const { register } = useContext(Ctx);
  useEffect(() => (type === "text" ? register(addonId) : undefined), [type, addonId, register]);
  return (
    <div
      {...rest}
      ref={ref}
      id={addonId}
      aria-hidden={type === "icon" ? true : undefined}
      className={cx(addonBase, addonTypes[type], type === "text" && dividers[align], className)}
    >
      {children}
    </div>
  );
});
