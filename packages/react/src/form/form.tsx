"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type FormHTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { formDefaults, type FormSpecProps } from "../generated/form.types";
import { Button, type ButtonProps } from "../button/button";
import { cx } from "../utils/cx";
import type { ActionState } from "../utils/state";
import { findFieldRoot, firstFocusable } from "./focus";
import { useEngineValues, useFormEngine, type FormEngine, type FormSchema } from "./form-engine";

/** What onSubmit may return to report problems the server found. */
export interface SubmitResult {
  /** Errors by field name, shown on those fields. */
  fieldErrors?: Record<string, string>;
  /** A message about the whole form, shown in the ErrorSummary. */
  formError?: string;
}

/** What children and useFormState() receive. */
export interface FormRenderState {
  state: ActionState;
  isPending: boolean;
  /** The message about the whole form after a failed submit. */
  formError?: string;
  /** The error that onSubmit threw, if it did. */
  error?: unknown;
}

export interface FormContextValue {
  engine: FormEngine;
  formRef: RefObject<HTMLFormElement | null>;
  state: FormRenderState;
  /** Counts failed submits (a validator stopped it, or onSubmit failed). The ErrorSummary moves focus on each. */
  focusRequest: number;
  serverErrors: Record<string, string>;
  clearServerError(name: string): void;
  /** Field labels for the ErrorSummary, filled in by each Field. */
  labels: Map<string, string>;
  /** How many ErrorSummary components are mounted. Without one, a failure is announced by the form itself. */
  summaries: RefObject<number>;
  focusField(name: string): boolean;
}

const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext(): FormContextValue {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error("This component must be used inside a <Form>.");
  return ctx;
}

/** The action state of the nearest Form: idle, pending, success or error. */
export function useFormState(): FormRenderState {
  return useFormContext().state;
}

/**
 * Reads what is typed in the form, for derived display such as a total.
 * Pass a selector and return something cheap to compare, like a number.
 * The calculation is yours; the form only hands over the values.
 */
export function useFormValues<TValues = Record<string, any>, TResult = TValues>(select?: (values: TValues) => TResult): TResult {
  const { engine } = useFormContext();
  return useEngineValues(engine as FormEngine<TValues>, (select ?? ((v: TValues) => v as unknown as TResult)) as (v: TValues) => TResult);
}

export interface FormProps<TValues = Record<string, any>>
  extends Omit<FormSpecProps, "defaultValues" | "onSubmit" | "schema" | "children">,
    Omit<FormHTMLAttributes<HTMLFormElement>, keyof FormSpecProps | "className" | "noValidate" | "onReset"> {
  defaultValues: TValues;
  onSubmit: (values: TValues) => void | SubmitResult | Promise<void | SubmitResult>;
  schema?: FormSchema<TValues>;
  children?: ReactNode | ((form: FormRenderState) => ReactNode);
  className?: string;
}

/**
 * A form with its own checks turned off (noValidate): the checks are the
 * validators and schema you pass, so errors look and read the same everywhere.
 * It owns no data fetching: your onSubmit does the work and may return errors.
 */
export function Form<TValues extends Record<string, any> = Record<string, any>>({
  defaultValues,
  onSubmit,
  schema,
  validateOn = formDefaults.validateOn,
  successMessage,
  errorMessage = formDefaults.errorMessage,
  resetOnSuccess = formDefaults.resetOnSuccess,
  children,
  className,
  ...rest
}: FormProps<TValues>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<ActionState>("idle");
  const [error, setError] = useState<unknown>();
  const [formError, setFormError] = useState<string>();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [focusRequest, setFocusRequest] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const [announceCount, setAnnounceCount] = useState(0);
  const busy = useRef(false);
  const summaries = useRef(0);
  const labels = useMemo(() => new Map<string, string>(), []);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  const announce = (text: string) => {
    setAnnouncement(text);
    setAnnounceCount((n) => n + 1);
  };

  const engine = useFormEngine<TValues>({
    defaultValues,
    schema,
    validateOn,
    onInvalid: () => {
      setFormError(undefined);
      setFocusRequest((n) => n + 1);
    },
    onSubmit: async (values) => {
      if (busy.current) return;
      busy.current = true;
      setState("pending");
      setError(undefined);
      setFormError(undefined);
      setServerErrors({});
      const fail = (message: string) => {
        setState("error");
        setFormError(message);
        setFocusRequest((n) => n + 1);
        if (summaries.current === 0) announce(message);
      };
      try {
        const result = await onSubmitRef.current(values);
        if (result && (result.formError || (result.fieldErrors && Object.keys(result.fieldErrors).length))) {
          setServerErrors(result.fieldErrors ?? {});
          fail(result.formError ?? errorMessage);
        } else {
          setState("success");
          if (successMessage) announce(successMessage);
          if (resetOnSuccess) engine.reset();
        }
      } catch (e) {
        setError(e);
        fail(errorMessage);
      } finally {
        busy.current = false;
      }
    },
  });

  const focusField = useCallback(
    (name: string) => {
      const target = firstFocusable(findFieldRoot(formRef.current, name));
      target?.focus();
      return Boolean(target);
    },
    [],
  );

  const render = useMemo<FormRenderState>(
    () => ({ state, isPending: state === "pending", formError, error }),
    [state, formError, error],
  );

  const context = useMemo<FormContextValue>(
    () => ({
      engine,
      formRef,
      state: render,
      focusRequest,
      serverErrors,
      clearServerError: (name) =>
        setServerErrors((current) => {
          if (!(name in current)) return current;
          const { [name]: _gone, ...next } = current;
          return next;
        }),
      labels,
      summaries,
      focusField,
    }),
    [engine, render, focusRequest, serverErrors, labels, focusField],
  );

  return (
    <FormContext.Provider value={context}>
      <form
        {...rest}
        ref={formRef}
        noValidate
        aria-busy={state === "pending" || undefined}
        className={cx("flex flex-col gap-4", className)}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void engine.submit();
        }}
        onReset={(event) => {
          event.preventDefault();
          engine.reset();
          setState("idle");
          setFormError(undefined);
          setServerErrors({});
        }}
      >
        {typeof children === "function" ? children(render) : children}
        {/* Said in words for screen readers; a changing counter makes a repeated message read again. */}
        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
          {announceCount % 2 === 1 ? "" : " "}
        </div>
      </form>
    </FormContext.Provider>
  );
}

/** A submit button that shows the pending state of its Form. */
export function FormSubmitButton({ children, ...rest }: Omit<ButtonProps, "type" | "isLoading" | "onPress">) {
  const { state } = useFormContext();
  return (
    <Button {...rest} type="submit" isLoading={state.isPending}>
      {children}
    </Button>
  );
}

export type { FormEngine };
