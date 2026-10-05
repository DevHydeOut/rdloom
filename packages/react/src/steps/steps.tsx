"use client";

import { Children, createContext, forwardRef, isValidElement, useContext, type ReactNode } from "react";
import { stepsDefaults, type StepsSpecProps } from "../generated/steps.types";
import { cx } from "../utils/cx";
import { CheckIcon } from "../utils/icons";

export interface StepsProps extends StepsSpecProps {
  className?: string;
}

interface StepPosition {
  number: number;
  total: number;
  currentStep: number;
  orientation: "horizontal" | "vertical";
}

const StepContext = createContext<StepPosition | null>(null);

export const Steps = forwardRef<HTMLOListElement, StepsProps>(function Steps(
  { children, currentStep, orientation = stepsDefaults.orientation, label = stepsDefaults.label, className },
  ref,
) {
  const steps = Children.toArray(children).filter(isValidElement);
  return (
    <ol
      ref={ref}
      aria-label={label}
      className={cx(orientation === "horizontal" ? "flex w-full items-start" : "flex flex-col", className)}
    >
      {steps.map((step, index) => (
        <StepContext.Provider key={step.key ?? index} value={{ number: index + 1, total: steps.length, currentStep, orientation }}>
          {step}
        </StepContext.Provider>
      ))}
    </ol>
  );
});

export interface StepProps {
  title: ReactNode;
  /** A line of detail under the title. */
  description?: ReactNode;
  className?: string;
}

export function Step({ title, description, className }: StepProps) {
  const position = useContext(StepContext);
  if (!position) throw new Error("Step must be used inside Steps.");
  const { number, total, currentStep, orientation } = position;
  const state = number < currentStep ? "complete" : number === currentStep ? "current" : "upcoming";
  const last = number === total;
  const horizontal = orientation === "horizontal";
  const said = state === "complete" ? "Completed" : state === "current" ? "Current step" : "Not started";

  const marker = (
    <span
      aria-hidden="true"
      className={cx(
        "relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors",
        state === "complete" && "bg-[var(--rd-color-action-primary)] text-[var(--rd-color-action-on-primary)]",
        // The current step is a filled ring with the number inside: a different shape, not only a different color.
        state === "current" &&
          "bg-[var(--rd-color-surface-default)] text-[var(--rd-color-action-primary)] ring-2 ring-[var(--rd-color-action-primary)] ring-offset-2 ring-offset-[var(--rd-color-surface-default)]",
        state === "upcoming" && "border border-[var(--rd-color-border-strong)] bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-muted)]",
      )}
    >
      {state === "complete" ? <CheckIcon className="size-4 text-[var(--rd-color-action-on-primary)]" /> : number}
    </span>
  );
  const connector = !last && (
    <span
      aria-hidden="true"
      className={cx(
        "absolute transition-colors",
        horizontal ? "start-[calc(50%+1.25rem)] end-[calc(-50%+1.25rem)] top-3.5 h-px" : "start-[1.125rem] top-10 -bottom-1 w-px",
        state === "complete" ? "bg-[var(--rd-color-action-primary)]" : "bg-[var(--rd-color-border-default)]",
      )}
    />
  );
  const text = (
    <span className={cx("flex min-w-0 flex-col", horizontal ? "items-center text-center" : "pb-8 pt-0.5")}>
      <span className="sr-only">{`Step ${number} of ${total}, ${said}: `}</span>
      <span className={cx("text-sm font-medium", state === "upcoming" ? "text-[var(--rd-color-text-muted)]" : "text-[var(--rd-color-text-default)]")}>{title}</span>
      {description && <span className="text-xs text-[var(--rd-color-text-muted)]">{description}</span>}
    </span>
  );

  return (
    <li
      aria-current={state === "current" ? "step" : undefined}
      className={cx("relative flex", horizontal ? "flex-1 flex-col items-center gap-2" : "gap-4 ps-1", className)}
    >
      {connector}
      {marker}
      {text}
    </li>
  );
}
