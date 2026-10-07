"use client";

// The only file that knows which form engine runs underneath (TanStack Form).
// Everything else in form/, field-array/ and error-summary/ talks to the small
// interface below, so the engine can be swapped by rewriting this one file.
// Nothing here fetches data: it holds values, runs validators and reports errors.

import { revalidateLogic, useField, useForm, useStore, type StandardSchemaV1 } from "@tanstack/react-form";
import { useMemo } from "react";

/** Any validator that follows the Standard Schema spec (Zod, Valibot, ArkType...). */
export type FormSchema<TValues = any> = StandardSchemaV1<TValues, any>;

/** When errors first appear. After a failed submit they always update as the person types. */
export type ValidateOn = "submit" | "blur" | "change";

/** A message when the value is wrong, nothing when it is fine. */
export type FieldValidator<TValue = any, TValues = any> = (
  value: TValue,
  values: TValues,
) => string | null | undefined | false | void;

export type AsyncFieldValidator<TValue = any, TValues = any> = (
  value: TValue,
  values: TValues,
) => Promise<string | null | undefined | false | void>;

export interface FormEngineOptions<TValues> {
  defaultValues: TValues;
  schema?: FormSchema<TValues>;
  validateOn?: ValidateOn;
  /** Runs when every validator passes. */
  onSubmit: (values: TValues) => void | Promise<void>;
  /** Runs when a submit is stopped by a validator. */
  onInvalid?: () => void;
}

export interface FormEngine<TValues = any> {
  submit(): Promise<void>;
  reset(values?: TValues): void;
  getValues(): TValues;
  setValue(name: string, value: unknown): void;
  /** The engine's own form object. Only this file reads it. */
  readonly api: unknown;
}

export interface FieldOptions<TValue = any, TValues = any> {
  validate?: FieldValidator<TValue, TValues>;
  validateAsync?: AsyncFieldValidator<TValue, TValues>;
  asyncDebounceMs?: number;
}

export interface FieldBinding<TValue = any> {
  value: TValue;
  errors: string[];
  isTouched: boolean;
  isValidating: boolean;
  setValue(value: TValue): void;
  blur(): void;
}

export interface ArrayBinding<TRow = any> {
  length: number;
  errors: string[];
  push(row: TRow): void;
  insert(index: number, row: TRow): void;
  remove(index: number): void;
  move(from: number, to: number): void;
}

export interface FieldErrorEntry {
  name: string;
  message: string;
}

// The form object is typed loosely on purpose: the adapter is the boundary.
const asApi = (engine: FormEngine) => engine.api as any;

function messageOf(issue: unknown): string | undefined {
  if (typeof issue === "string") return issue || undefined;
  if (issue && typeof issue === "object" && "message" in issue) {
    const m = (issue as { message?: unknown }).message;
    return typeof m === "string" && m ? m : undefined;
  }
  return undefined;
}

function messagesOf(errors: unknown): string[] {
  const list = Array.isArray(errors) ? errors : errors ? [errors] : [];
  return [...new Set(list.map(messageOf).filter((m): m is string => Boolean(m)))];
}

export function useFormEngine<TValues>(options: FormEngineOptions<TValues>): FormEngine<TValues> {
  const form = useForm({
    defaultValues: options.defaultValues as any,
    validationLogic: revalidateLogic({ mode: options.validateOn ?? "submit", modeAfterSubmission: "change" }),
    validators: options.schema ? { onDynamic: options.schema as any } : undefined,
    onSubmit: async ({ value }: { value: any }) => options.onSubmit(value as TValues),
    onSubmitInvalid: () => options.onInvalid?.(),
  } as any) as any;

  return useMemo<FormEngine<TValues>>(
    () => ({
      api: form,
      submit: () => form.handleSubmit(),
      reset: (values) => form.reset(values),
      getValues: () => form.state.values,
      setValue: (name, value) => form.setFieldValue(name, value),
    }),
    [form],
  );
}

/** Reads values for display or derived numbers. Return something cheap to compare, such as a number. */
export function useEngineValues<TValues, TResult>(engine: FormEngine<TValues>, select: (values: TValues) => TResult): TResult {
  return useStore(asApi(engine).store, (state: { values: TValues }) => select(state.values)) as TResult;
}

export function useEngineField<TValue = any>(
  engine: FormEngine,
  name: string,
  options: FieldOptions<TValue> = {},
): FieldBinding<TValue> {
  const { validate, validateAsync, asyncDebounceMs = 300 } = options;
  const field = useField({
    form: asApi(engine),
    name,
    validators: {
      ...(validate ? { onDynamic: ({ value, fieldApi }: any) => validate(value, fieldApi.form.state.values) || undefined } : {}),
      ...(validateAsync
        ? {
            onDynamicAsync: async ({ value, fieldApi }: any) => (await validateAsync(value, fieldApi.form.state.values)) || undefined,
            onDynamicAsyncDebounceMs: asyncDebounceMs,
          }
        : {}),
    },
  } as any) as any;
  const meta = field.state.meta;
  return {
    value: field.state.value,
    errors: messagesOf(meta.errors),
    isTouched: Boolean(meta.isTouched),
    isValidating: Boolean(meta.isValidating),
    setValue: (value) => field.handleChange(value),
    blur: () => field.handleBlur(),
  };
}

export function useEngineArray<TRow = any>(
  engine: FormEngine,
  name: string,
  options: { validate?: FieldValidator<TRow[]> } = {},
): ArrayBinding<TRow> {
  const { validate } = options;
  const field = useField({
    form: asApi(engine),
    name,
    mode: "array",
    validators: validate ? { onDynamic: ({ value, fieldApi }: any) => validate(value ?? [], fieldApi.form.state.values) || undefined } : undefined,
  } as any) as any;
  const rows = field.state.value;
  return {
    length: Array.isArray(rows) ? rows.length : 0,
    errors: messagesOf(field.state.meta.errors),
    push: (row) => field.pushValue(row),
    insert: (index, row) => field.insertValue(index, row),
    remove: (index) => field.removeValue(index),
    move: (from, to) => field.moveValue(from, to),
  };
}

/** The first message of every field that has errors, in the order the fields were added. */
export function useEngineErrors(engine: FormEngine): FieldErrorEntry[] {
  const meta = useStore(asApi(engine).store, (state: { fieldMeta: Record<string, { errors?: unknown }> }) => state.fieldMeta);
  return useMemo(
    () =>
      Object.entries((meta ?? {}) as Record<string, { errors?: unknown }>).flatMap(([name, m]) => {
        const message = messagesOf(m?.errors)[0];
        return message ? [{ name, message }] : [];
      }),
    [meta],
  );
}
