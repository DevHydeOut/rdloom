"use client";

import { forwardRef, useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  Button as AriaButton,
  Checkbox as AriaCheckbox,
  CheckboxGroup as AriaCheckboxGroup,
  Input,
  ProgressBar,
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
  TextField,
} from "react-aria-components";
import { questionnaireDefaults, type QuestionnaireSpecProps } from "../generated/questionnaire.types";
import { cx } from "../utils/cx";
import { ArrowRightIcon, CheckIcon, ChevronLeftIcon } from "../utils/icons";

export interface QuestionnaireOption {
  value: string;
  label: string;
  description?: string;
}

export interface QuestionnaireQuestion {
  id: string;
  type: "single" | "multiple" | "text" | "scale";
  title: string;
  description?: string;
  /** Choices for single and multiple questions. */
  options?: QuestionnaireOption[];
  required?: boolean;
  /** Text under the low and high end of a scale question. */
  lowLabel?: string;
  highLabel?: string;
  /** Hint inside a text answer. */
  placeholder?: string;
}

export type QuestionnaireAnswer = string | string[] | number;
export type QuestionnaireAnswers = Record<string, QuestionnaireAnswer>;

export interface QuestionnaireProps extends QuestionnaireSpecProps {
  className?: string;
}

const SCALE = [1, 2, 3, 4, 5];

const isEmpty = (answer: QuestionnaireAnswer | undefined) =>
  answer === undefined || (typeof answer === "string" && answer.trim() === "") || (Array.isArray(answer) && answer.length === 0);

function describeAnswer(question: QuestionnaireQuestion, answer: QuestionnaireAnswer | undefined): string | null {
  if (answer === undefined || isEmpty(answer)) return null;
  const labelOf = (value: string) => question.options?.find((o) => o.value === value)?.label ?? value;
  if (Array.isArray(answer)) return answer.map(labelOf).join(", ");
  if (typeof answer === "number") return `${answer} of ${SCALE.length}`;
  return question.type === "single" ? labelOf(answer) : answer;
}

const card =
  "group flex cursor-pointer items-start gap-3 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-4 py-3 text-start outline-none " +
  "data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[selected]:border-[var(--rd-color-action-primary)] data-[selected]:bg-[var(--rd-color-surface-selected)] " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

const buttonBase =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--rd-radius-control)] px-4 text-sm font-medium outline-none " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50";
const primaryButton = cx(buttonBase, "bg-[var(--rd-color-action-primary)] text-[var(--rd-color-action-on-primary)] data-[hovered]:bg-[var(--rd-color-action-primary-hover)]");
const quietButton = cx(buttonBase, "border border-[var(--rd-color-border-strong)] bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] data-[hovered]:bg-[var(--rd-color-surface-subtle)]");

/**
 * A short flow of questions, one at a time, ending with a review step. It keeps answers when the
 * person goes back, checks required questions before moving on, and calls onSubmit with the
 * answers keyed by question id.
 */
export const Questionnaire = forwardRef<HTMLDivElement, QuestionnaireProps>(function Questionnaire(
  {
    questions,
    onSubmit,
    onCancel,
    defaultAnswers,
    allowSkip = questionnaireDefaults.allowSkip,
    label = questionnaireDefaults.label,
    submitLabel = questionnaireDefaults.submitLabel,
    isSubmitting = questionnaireDefaults.isSubmitting,
    className,
  },
  ref,
) {
  const baseId = useId();
  const total = questions.length;
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(defaultAnswers ?? {});
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fromReview, setFromReview] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  // The step last shown. Comparing with it (not a "mounted" flag) keeps the first render, and the
  // double effect run of React strict mode, from moving focus.
  const shownStep = useRef(step);

  const reviewing = step >= total;
  const question = reviewing ? undefined : questions[step];

  // Move focus to the new heading and say where the person is.
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    heading.current?.focus();
    setAnnouncement(reviewing ? "Review your answers" : `Question ${step + 1} of ${total}`);
  }, [step, reviewing, total]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const setAnswer = (id: string, value: QuestionnaireAnswer | undefined) => {
    setError(null);
    setAnswers((prev) => {
      const nextAnswers = { ...prev };
      if (value === undefined || isEmpty(value)) delete nextAnswers[id];
      else nextAnswers[id] = value;
      return nextAnswers;
    });
  };

  const goTo = (target: number) => {
    setError(null);
    setStep(target);
  };

  const advance = () => {
    if (fromReview) {
      setFromReview(false);
      goTo(total);
    } else goTo(step + 1);
  };

  const next = () => {
    if (!question) return;
    if (question.required && isEmpty(answers[question.id])) {
      setError("Answer this question to continue.");
      // A second attempt with the same message still has to pull focus back.
      errorRef.current?.focus();
      return;
    }
    advance();
  };

  const skip = () => {
    if (!question) return;
    setAnswer(question.id, undefined);
    advance();
  };

  const back = () => {
    setFromReview(false);
    goTo(Math.max(0, step - 1));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (reviewing) {
      if (!isSubmitting) onSubmit(answers);
    } else next();
  };

  const headingId = `${baseId}-heading`;
  const errorId = `${baseId}-error`;
  const invalid = Boolean(error);
  const current = question ? answers[question.id] : undefined;
  const progressText = reviewing ? "Review" : `Question ${step + 1} of ${total}`;

  const control = () => {
    if (!question) return null;
    const common = { "aria-labelledby": headingId, "aria-describedby": invalid ? errorId : undefined, isInvalid: invalid || undefined } as const;
    switch (question.type) {
      case "single":
        return (
          <AriaRadioGroup {...common} value={typeof current === "string" ? current : ""} onChange={(v) => setAnswer(question.id, v)} className="flex flex-col gap-2">
            {question.options?.map((o) => (
              <AriaRadio key={o.value} value={o.value} className={card}>
                <span aria-hidden="true" className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-[var(--rd-color-border-strong)] group-data-[selected]:border-[var(--rd-color-action-primary)]">
                  <span className="hidden size-2 rounded-full bg-[var(--rd-color-action-primary)] group-data-[selected]:block" />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--rd-color-text-default)]">{o.label}</span>
                  {o.description && <span className="text-sm text-[var(--rd-color-text-muted)]">{o.description}</span>}
                </span>
              </AriaRadio>
            ))}
          </AriaRadioGroup>
        );
      case "multiple":
        return (
          <AriaCheckboxGroup {...common} value={Array.isArray(current) ? current : []} onChange={(v) => setAnswer(question.id, v)} className="flex flex-col gap-2">
            {question.options?.map((o) => (
              <AriaCheckbox key={o.value} value={o.value} className={card}>
                <span aria-hidden="true" className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-[var(--rd-color-border-strong)] group-data-[selected]:border-[var(--rd-color-action-primary)] group-data-[selected]:bg-[var(--rd-color-action-primary)] group-data-[selected]:text-[var(--rd-color-action-on-primary)]">
                  <CheckIcon className="hidden size-3 text-current group-data-[selected]:block" strokeWidth={2.5} />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--rd-color-text-default)]">{o.label}</span>
                  {o.description && <span className="text-sm text-[var(--rd-color-text-muted)]">{o.description}</span>}
                </span>
              </AriaCheckbox>
            ))}
          </AriaCheckboxGroup>
        );
      case "text":
        return (
          <TextField {...common} value={typeof current === "string" ? current : ""} onChange={(v) => setAnswer(question.id, v)}>
            <Input
              placeholder={question.placeholder}
              className="h-10 w-full rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-strong)] bg-[var(--rd-color-surface-default)] px-3 text-sm text-[var(--rd-color-text-default)] outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[invalid]:border-[var(--rd-color-feedback-danger)]"
            />
          </TextField>
        );
      case "scale":
        return (
          <div className="flex flex-col gap-2">
            <AriaRadioGroup {...common} orientation="horizontal" value={typeof current === "number" ? String(current) : ""} onChange={(v) => setAnswer(question.id, Number(v))} className="flex gap-2">
              {SCALE.map((n) => (
                <AriaRadio
                  key={n}
                  value={String(n)}
                  className="flex size-11 cursor-pointer items-center justify-center rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-strong)] bg-[var(--rd-color-surface-default)] text-sm font-medium text-[var(--rd-color-text-default)] outline-none data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[selected]:border-[var(--rd-color-action-primary)] data-[selected]:bg-[var(--rd-color-action-primary)] data-[selected]:text-[var(--rd-color-action-on-primary)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
                >
                  {n}
                </AriaRadio>
              ))}
            </AriaRadioGroup>
            {(question.lowLabel || question.highLabel) && (
              <div className="flex max-w-[15rem] justify-between text-xs text-[var(--rd-color-text-muted)]">
                <span>{question.lowLabel}</span>
                <span>{question.highLabel}</span>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div ref={ref} role="group" aria-label={label} className={cx("flex w-full max-w-xl flex-col gap-6", className)}>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-[var(--rd-color-text-muted)]">{progressText}</span>
        <ProgressBar aria-label={`${label} progress`} minValue={0} maxValue={total} value={reviewing ? total : step + 1} valueLabel={progressText}>
          {({ percentage }) => (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--rd-color-surface-subtle)]">
              <div className="h-full rounded-full bg-[var(--rd-color-action-primary)] transition-[width] motion-reduce:transition-none" style={{ width: `${percentage}%` }} />
            </div>
          )}
        </ProgressBar>
      </div>

      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        {question ? (
          <div key={question.id} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id={headingId} ref={heading} tabIndex={-1} className="text-lg font-semibold text-[var(--rd-color-text-default)] outline-none">
                {question.title}
                {question.required && <span aria-hidden="true" className="text-[var(--rd-color-feedback-danger)]">{" *"}</span>}
              </h2>
              {question.description && <p className="text-sm text-[var(--rd-color-text-muted)]">{question.description}</p>}
            </div>
            {control()}
            {error && (
              <p ref={errorRef} id={errorId} role="alert" tabIndex={-1} className="text-sm text-[var(--rd-color-feedback-danger)] outline-none">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h2 ref={heading} tabIndex={-1} className="text-lg font-semibold text-[var(--rd-color-text-default)] outline-none">
              Review your answers
            </h2>
            <ul className="flex flex-col divide-y divide-[var(--rd-color-border-default)] rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)]">
              {questions.map((q, i) => {
                const text = describeAnswer(q, answers[q.id]);
                return (
                  <li key={q.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm text-[var(--rd-color-text-muted)]">{q.title}</span>
                      <span className={cx("text-sm break-words", text ? "text-[var(--rd-color-text-default)]" : "text-[var(--rd-color-text-muted)] italic")}>{text ?? "Skipped"}</span>
                    </div>
                    <AriaButton
                      onPress={() => {
                        setFromReview(true);
                        goTo(i);
                      }}
                      className="shrink-0 rounded px-1 text-sm font-medium text-[var(--rd-color-action-primary)] underline underline-offset-2 outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
                    >
                      Edit<span className="sr-only"> answer: {q.title}</span>
                    </AriaButton>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {step > 0 && !fromReview && (
              <AriaButton onPress={back} isDisabled={isSubmitting} className={quietButton}>
                <ChevronLeftIcon />
                Back
              </AriaButton>
            )}
            {onCancel && (
              <AriaButton onPress={onCancel} className={quietButton}>
                Cancel
              </AriaButton>
            )}
          </div>
          <div className="flex gap-2">
            {allowSkip && question && !question.required && (
              <AriaButton onPress={skip} className={quietButton}>
                Skip
              </AriaButton>
            )}
            {reviewing ? (
              <AriaButton type="submit" isDisabled={isSubmitting} className={primaryButton}>
                {submitLabel}
              </AriaButton>
            ) : (
              <AriaButton type="submit" className={primaryButton}>
                {fromReview ? "Done" : step === total - 1 ? "Review" : "Next"}
                {!fromReview && <ArrowRightIcon />}
              </AriaButton>
            )}
          </div>
        </div>
      </form>

      <div role="status" className="sr-only">
        {announcement}
      </div>
    </div>
  );
});
