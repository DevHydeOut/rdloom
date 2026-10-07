"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import type { Key } from "react-aria-components";
import { Checkbox, type CheckboxProps } from "../checkbox/checkbox";
import { NumberField, type NumberFieldProps } from "../number-field/number-field";
import { Select, type SelectProps } from "../select/select";
import { Switch, type SwitchProps } from "../switch/switch";
import { TextField, type TextFieldProps } from "../text-field/text-field";
import { fieldError } from "../utils/field";
import { useFormContext } from "./form";
import { useEngineField, type AsyncFieldValidator, type FieldValidator } from "./form-engine";

export interface FieldOptions<TValue = any> {
  /** Name of the value in the form. Nested names work: "address.city", "lines[0].qty". */
  name: string;
  /** How this field is named in the ErrorSummary. Use the visible label. */
  label?: string;
  /** Adds a built-in check that the field is not empty. */
  isRequired?: boolean;
  /** The message when a required field is empty. */
  requiredMessage?: string;
  /** Returns a message when the value is wrong. Gets the value and all values. */
  validate?: FieldValidator<TValue>;
  /** The same, for a check that needs the network. Runs after the value settles. */
  validateAsync?: AsyncFieldValidator<TValue>;
}

/** What a Field hands to its render function. */
export interface FieldState<TValue = any> {
  name: string;
  value: TValue;
  setValue(value: TValue): void;
  onBlur(): void;
  isInvalid: boolean;
  /** The first error to show, from the field's validator, the schema, or the server. */
  errorMessage?: string;
  errors: string[];
  isTouched: boolean;
  isValidating: boolean;
  /** For TextField and other inputs that take text. */
  inputProps: {
    name: string;
    value: string;
    onChange(value: string): void;
    onBlur(): void;
    isInvalid?: boolean;
    errorMessage?: string;
    isRequired?: boolean;
    validationBehavior: "aria";
  };
  /** For NumberField. An empty field is stored as null. */
  numberProps: {
    name: string;
    value: number;
    onChange(value: number): void;
    onBlur(): void;
    isInvalid?: boolean;
    errorMessage?: string;
    isRequired?: boolean;
    validationBehavior: "aria";
  };
  /** For Select and other pickers that use a key. */
  selectProps: {
    name: string;
    selectedKey: Key | null;
    onSelectionChange(key: Key | null): void;
    onBlur(): void;
    isInvalid?: boolean;
    errorMessage?: string;
    isRequired?: boolean;
    validationBehavior: "aria";
  };
  /** For Checkbox and Switch. */
  checkProps: {
    name: string;
    isSelected: boolean;
    onChange(isSelected: boolean): void;
    onBlur(): void;
    isInvalid?: boolean;
  };
}

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === false ||
  (typeof value === "string" && value.trim() === "") ||
  (typeof value === "number" && Number.isNaN(value)) ||
  (Array.isArray(value) && value.length === 0);

export interface FieldProps<TValue = any> extends FieldOptions<TValue> {
  children: (field: FieldState<TValue>) => ReactNode;
}

/**
 * Connects one value of the Form to any input. The render function receives
 * the value, the error and ready-made prop sets for the library's inputs;
 * the inputs already link their label, help text and error with aria-describedby
 * and set aria-invalid.
 */
export function Field<TValue = any>({ name, label, isRequired, requiredMessage, validate, validateAsync, children }: FieldProps<TValue>) {
  const form = useFormContext();
  const { serverErrors, clearServerError, labels } = form;

  const required = isRequired
    ? (value: TValue, all: unknown) => (isEmpty(value) ? (requiredMessage ?? (label ? `${label} is required` : "This field is required")) : validate?.(value, all))
    : validate;
  const binding = useEngineField<TValue>(form.engine, name, { validate: required as FieldValidator<TValue> | undefined, validateAsync });

  useEffect(() => {
    if (label) labels.set(name, label);
    return () => {
      labels.delete(name);
    };
  }, [labels, name, label]);

  // A server error stays until the person changes the value.
  const serverError = serverErrors[name];
  const seenAt = useRef<{ value: unknown } | null>(null);
  if (serverError && !seenAt.current) seenAt.current = { value: binding.value };
  if (!serverError) seenAt.current = null;
  useEffect(() => {
    if (serverError && seenAt.current && !Object.is(seenAt.current.value, binding.value)) {
      seenAt.current = null;
      clearServerError(name);
    }
  }, [binding.value, serverError, clearServerError, name]);

  const errors = serverError ? [serverError, ...binding.errors] : binding.errors;
  const errorMessage = errors[0];
  const isInvalid = errors.length > 0;
  // Only passed when true: a defined isInvalid would switch off the input's own checks.
  const invalid = isInvalid ? true : undefined;
  const asRequired = isRequired || undefined;

  const state: FieldState<TValue> = {
    name,
    value: binding.value,
    setValue: binding.setValue,
    onBlur: binding.blur,
    isInvalid,
    errorMessage,
    errors,
    isTouched: binding.isTouched,
    isValidating: binding.isValidating,
    inputProps: {
      name,
      value: (binding.value as unknown as string | undefined) ?? "",
      onChange: (value) => binding.setValue(value as unknown as TValue),
      onBlur: binding.blur,
      isInvalid: invalid,
      errorMessage,
      isRequired: asRequired,
      validationBehavior: "aria",
    },
    numberProps: {
      name,
      value: typeof binding.value === "number" ? binding.value : Number.NaN,
      onChange: (value) => binding.setValue((Number.isNaN(value) ? null : value) as unknown as TValue),
      onBlur: binding.blur,
      isInvalid: invalid,
      errorMessage,
      isRequired: asRequired,
      validationBehavior: "aria",
    },
    selectProps: {
      name,
      selectedKey: ((binding.value as unknown as Key | undefined) ?? null) as Key | null,
      onSelectionChange: (key) => binding.setValue(key as unknown as TValue),
      onBlur: binding.blur,
      isInvalid: invalid,
      errorMessage,
      isRequired: asRequired,
      validationBehavior: "aria",
    },
    checkProps: {
      name,
      isSelected: Boolean(binding.value),
      onChange: (selected) => binding.setValue(selected as unknown as TValue),
      onBlur: binding.blur,
      isInvalid: invalid,
    },
  };

  // The wrapper has no box of its own; it only lets the ErrorSummary find the control by name.
  return (
    <div data-rd-field={name} className="contents">
      {children(state)}
    </div>
  );
}

type Bound<TProps> = Omit<
  TProps,
  "value" | "defaultValue" | "onChange" | "name" | "isInvalid" | "errorMessage" | "validate" | "validationBehavior" | "onBlur" | "isRequired"
> &
  Pick<FieldOptions, "name" | "isRequired" | "requiredMessage" | "validate" | "validateAsync">;

export type FormTextFieldProps = Bound<TextFieldProps>;
export type FormNumberFieldProps = Bound<NumberFieldProps>;
export type FormSelectProps = Bound<SelectProps>;

/** A TextField connected to the Form by name. */
export function FormTextField({ name, isRequired, requiredMessage, validate, validateAsync, ...props }: FormTextFieldProps) {
  return (
    <Field<string> name={name} label={props.label} isRequired={isRequired} requiredMessage={requiredMessage} validate={validate} validateAsync={validateAsync}>
      {(f) => <TextField {...props} {...f.inputProps} />}
    </Field>
  );
}

/** A NumberField connected to the Form by name. */
export function FormNumberField({ name, isRequired, requiredMessage, validate, validateAsync, ...props }: FormNumberFieldProps) {
  return (
    <Field<number | null> name={name} label={props.label} isRequired={isRequired} requiredMessage={requiredMessage} validate={validate} validateAsync={validateAsync}>
      {(f) => <NumberField {...props} {...f.numberProps} />}
    </Field>
  );
}

/** A Select connected to the Form by name. The value is the key of the chosen item. */
export function FormSelect({ name, isRequired, requiredMessage, validate, validateAsync, ...props }: FormSelectProps) {
  return (
    <Field<Key | null> name={name} label={props.label} isRequired={isRequired} requiredMessage={requiredMessage} validate={validate} validateAsync={validateAsync}>
      {(f) => <Select {...props} {...f.selectProps} />}
    </Field>
  );
}

type BoundCheck<TProps> = Omit<TProps, "isSelected" | "defaultSelected" | "onChange" | "name" | "isInvalid" | "onBlur"> &
  Pick<FieldOptions, "name" | "requiredMessage" | "validate" | "validateAsync"> & { isRequired?: boolean };

export type FormCheckboxProps = BoundCheck<CheckboxProps>;
export type FormSwitchProps = BoundCheck<SwitchProps>;

/** The error under a checkbox or switch, linked to it with aria-describedby. */
function CheckError({ id, children }: { id: string; children?: string }) {
  return children ? (
    <p id={id} className={fieldError}>
      {children}
    </p>
  ) : null;
}

/** A Checkbox connected to the Form by name. isRequired means it must be checked. */
export function FormCheckbox({ name, isRequired, requiredMessage, validate, validateAsync, children, ...props }: FormCheckboxProps) {
  const errorId = useId();
  const label = typeof children === "string" ? children : undefined;
  return (
    <Field<boolean> name={name} label={label} isRequired={isRequired} requiredMessage={requiredMessage} validate={validate} validateAsync={validateAsync}>
      {(f) => (
        <div className="flex flex-col gap-1">
          <Checkbox {...(props as CheckboxProps)} {...f.checkProps} aria-describedby={f.errorMessage ? errorId : undefined}>
            {children}
          </Checkbox>
          <CheckError id={errorId}>{f.errorMessage}</CheckError>
        </div>
      )}
    </Field>
  );
}

/** A Switch connected to the Form by name. */
export function FormSwitch({ name, isRequired, requiredMessage, validate, validateAsync, children, ...props }: FormSwitchProps) {
  const errorId = useId();
  const label = typeof children === "string" ? children : undefined;
  return (
    <Field<boolean> name={name} label={label} isRequired={isRequired} requiredMessage={requiredMessage} validate={validate} validateAsync={validateAsync}>
      {(f) => {
        const { isInvalid: _invalid, ...bound } = f.checkProps;
        return (
          <div className="flex flex-col gap-1">
            <Switch {...(props as SwitchProps)} {...bound} aria-describedby={f.errorMessage ? errorId : undefined}>
              {children}
            </Switch>
            <CheckError id={errorId}>{f.errorMessage}</CheckError>
          </div>
        );
      }}
    </Field>
  );
}
