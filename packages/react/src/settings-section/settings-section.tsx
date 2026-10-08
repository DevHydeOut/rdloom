"use client";

import { createContext, createElement, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { settingsSectionDefaults, type SettingsSectionSpecProps } from "../generated/settings-section.types";
import { Button } from "../button/button";
import { ErrorSummary } from "../error-summary/error-summary";
import { firstFocusable } from "../form/focus";
import { Form, FormSubmitButton, useFormContext, useFormState, useFormValues, type SubmitResult } from "../form/form";
import { cx } from "../utils/cx";
import { SuccessIcon } from "../utils/icons";
import { resolvePermission } from "../utils/permissions";

export interface SettingsSectionProps extends SettingsSectionSpecProps {
  className?: string;
}

type Values = Record<string, any>;
type Classes = SettingsSectionProps["classNames"];

interface SectionContextValue {
  /** True when the app does not allow editing: the fields inside are disabled. */
  isReadOnly: boolean;
  /** Why editing is not allowed, when the app said. */
  reason?: string;
}

const SectionContext = createContext<SectionContextValue>({ isReadOnly: false });

/** Lets your own controls inside a SettingsSection read whether the section is read-only, and why. */
export function useSettingsSection(): SectionContextValue {
  return useContext(SectionContext);
}

/**
 * One group of related settings: title and description above a card (or beside it with orientation="split") with the content. With onSave the card is a form
 * whose Save and Cancel bar appears only when a value changed. It saves nothing itself.
 * UI permission is not security: the server must check again.
 */
export function SettingsSection({
  title,
  description,
  headingLevel = settingsSectionDefaults.headingLevel,
  children,
  orientation = settingsSectionDefaults.orientation,
  tone = settingsSectionDefaults.tone,
  defaultValues,
  onSave,
  onCancel,
  saveLabel = settingsSectionDefaults.saveLabel,
  successMessage = settingsSectionDefaults.successMessage,
  permissions,
  classNames,
  className,
}: SettingsSectionProps) {
  const access = resolvePermission(permissions?.edit);
  const headingId = useId();
  const reasonId = useId();
  const [saved, setSaved] = useState<Values>(() => defaultValues ?? {});
  if (!access.isVisible) return null;

  const readOnly = !access.isAllowed;
  const danger = tone === "danger";
  const level = Math.min(6, Math.max(2, Math.round(headingLevel)));
  const hasReason = readOnly && Boolean(access.reason);

  const body = (
    <>
      {hasReason && (
        <p id={reasonId} className={cx("px-5 pt-4 text-sm text-[var(--rd-color-text-muted)]", classNames?.reason)}>
          {access.reason}
        </p>
      )}
      {readOnly ? (
        <fieldset disabled data-rd-content aria-describedby={hasReason ? reasonId : undefined} className={cx("m-0 min-w-0 border-0 p-5", classNames?.content)}>
          {children}
        </fieldset>
      ) : (
        <div data-rd-content className={cx("min-w-0 p-5", classNames?.content)}>{children}</div>
      )}
    </>
  );

  const submit = async (values: Values): Promise<void | SubmitResult> => {
    if (!access.isAllowed) return { formError: access.reason ?? "You cannot change these settings." };
    const result = await onSave?.(values);
    if (result && (result.formError || (result.fieldErrors && Object.keys(result.fieldErrors).length))) return result;
    setSaved(values);
  };

  return (
    <section
      aria-labelledby={headingId}
      className={cx(
        "flex w-full flex-col gap-4",
        orientation === "split" && "md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-8",
        classNames?.root,
        className,
      )}
    >
      <div className={cx("flex min-w-0 flex-col gap-1", classNames?.header)}>
        {createElement(
          `h${level}`,
          {
            id: headingId,
            className: cx(
              "text-base font-semibold leading-6",
              danger ? "text-[var(--rd-color-feedback-danger)]" : "text-[var(--rd-color-text-default)]",
              classNames?.title,
            ),
          },
          title,
        )}
        {description && <p className={cx("max-w-prose text-sm text-[var(--rd-color-text-muted)]", classNames?.description)}>{description}</p>}
      </div>
      <SectionContext.Provider value={{ isReadOnly: readOnly, reason: access.reason }}>
        <div
          className={cx(
            "min-w-0 overflow-hidden rounded-[var(--rd-radius-overlay)] border bg-[var(--rd-color-surface-default)] [box-shadow:var(--rd-elevation-raised)]",
            danger ? "border-[color-mix(in_srgb,var(--rd-color-feedback-danger)_45%,var(--rd-color-border-default))]" : "border-[var(--rd-color-border-default)]",
            classNames?.card,
          )}
        >
          {onSave ? (
            <Form<Values> defaultValues={saved} onSubmit={submit} className="!gap-0">
              <div className="px-5 pt-5 empty:hidden">
                <ErrorSummary />
              </div>
              {body}
              <Bar saved={saved} saveLabel={saveLabel} successMessage={successMessage} onCancel={onCancel} classNames={classNames} />
            </Form>
          ) : (
            body
          )}
        </div>
      </SectionContext.Provider>
    </section>
  );
}

interface BarProps {
  saved: Values;
  saveLabel: string;
  successMessage: string;
  onCancel?: () => void;
  classNames: Classes;
}

/** The status line and, while something is changed, the Save and Cancel footer. */
function Bar({ saved, saveLabel, successMessage, onCancel, classNames }: BarProps) {
  const { engine, formRef } = useFormContext();
  const { state, isPending } = useFormState();
  const baseline = JSON.stringify(saved);
  const dirty = useFormValues<Values, boolean>((v) => JSON.stringify(v) !== baseline);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const showSaved = state === "success" && !dirty;

  // The Save button goes away once the values are saved, so focus would be lost: it moves to the status.
  useEffect(() => {
    if (state !== "success") return;
    const active = document.activeElement;
    if (!active || active === document.body || footerRef.current?.contains(active)) statusRef.current?.focus();
  }, [state]);

  const cancel = () => {
    // Focus goes to the first field before the footer, which holds the focused button, is taken away.
    firstFocusable(formRef.current?.querySelector("[data-rd-content]"))?.focus();
    formRef.current?.reset();
    engine.reset(saved);
    onCancel?.();
  };

  return (
    <>
      <p
        ref={statusRef}
        role="status"
        tabIndex={-1}
        className={cx(
          showSaved ? "flex items-center gap-2 px-5 pb-4 text-sm text-[var(--rd-color-feedback-success)] outline-none" : "sr-only",
          classNames?.status,
        )}
      >
        {dirty ? "Unsaved changes" : showSaved ? (
          <>
            <SuccessIcon className="size-4 shrink-0" />
            {successMessage}
          </>
        ) : null}
      </p>
      {dirty && (
        <div
          ref={footerRef}
          className={cx(
            "flex flex-wrap items-center justify-end gap-2 border-t border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] px-5 py-3",
            classNames?.footer,
          )}
        >
          <span aria-hidden="true" className="me-auto text-sm text-[var(--rd-color-text-muted)]">
            Unsaved changes
          </span>
          <Button type="button" variant="secondary" isDisabled={isPending} onPress={cancel} className={classNames?.cancelButton}>
            Cancel
          </Button>
          <FormSubmitButton className={classNames?.saveButton}>{saveLabel}</FormSubmitButton>
        </div>
      )}
    </>
  );
}

export interface SettingsRowProps {
  /** What the setting is called. */
  label: ReactNode;
  /** A line about what it does. */
  description?: ReactNode;
  /**
   * The control on the right: a Switch, a Select, a button. Pass a function to receive the ids of the label and
   * the description, so the control can name itself: aria-labelledby={labelId} aria-describedby={descriptionId}.
   */
  children: ReactNode | ((ids: { labelId: string; descriptionId: string }) => ReactNode);
  className?: string;
  classNames?: Partial<Record<"root" | "text" | "label" | "description" | "control", string>>;
}

/** One line of a toggle list: label and description on the left, the control on the right. Lines separate themselves. */
export function SettingsRow({ label, description, children, className, classNames }: SettingsRowProps) {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={cx(
        "flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-[var(--rd-color-border-default)] py-3 first:pt-0 last:border-b-0 last:pb-0",
        classNames?.root,
        className,
      )}
    >
      <div className={cx("flex min-w-0 flex-1 basis-56 flex-col gap-0.5", classNames?.text)}>
        <span id={labelId} className={cx("text-sm font-medium text-[var(--rd-color-text-default)]", classNames?.label)}>
          {label}
        </span>
        {description && (
          <span id={descriptionId} className={cx("text-sm text-[var(--rd-color-text-muted)]", classNames?.description)}>
            {description}
          </span>
        )}
      </div>
      <div className={cx("flex shrink-0 items-center", classNames?.control)}>
        {typeof children === "function" ? children({ labelId, descriptionId }) : children}
      </div>
    </div>
  );
}
