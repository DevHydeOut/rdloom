"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { Button as AriaButton } from "react-aria-components";
import { alertDefaults, type AlertSpecProps } from "../generated/alert.types";
import { cx } from "../utils/cx";
import { CloseIcon, ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from "../utils/icons";

export interface AlertProps
  extends AlertSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof AlertSpecProps | "className" | "title" | "role"> {
  className?: string;
}

const tones: Record<NonNullable<AlertSpecProps["variant"]>, { box: string; icon: string; Icon: typeof InfoIcon; say: string }> = {
  info: {
    box: "bg-[var(--rd-color-feedback-info-subtle)] border-[color-mix(in_srgb,var(--rd-color-feedback-info)_32%,transparent)]",
    icon: "text-[var(--rd-color-feedback-info)]",
    Icon: InfoIcon,
    say: "Information",
  },
  success: {
    box: "bg-[var(--rd-color-feedback-success-subtle)] border-[color-mix(in_srgb,var(--rd-color-feedback-success)_32%,transparent)]",
    icon: "text-[var(--rd-color-feedback-success)]",
    Icon: SuccessIcon,
    say: "Success",
  },
  warning: {
    box: "bg-[var(--rd-color-feedback-warning-subtle)] border-[color-mix(in_srgb,var(--rd-color-feedback-warning)_32%,transparent)]",
    icon: "text-[var(--rd-color-feedback-warning)]",
    Icon: WarningIcon,
    say: "Warning",
  },
  danger: {
    box: "bg-[var(--rd-color-feedback-danger-subtle)] border-[color-mix(in_srgb,var(--rd-color-feedback-danger)_32%,transparent)]",
    icon: "text-[var(--rd-color-feedback-danger)]",
    Icon: ErrorIcon,
    say: "Error",
  },
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    children,
    title,
    variant = alertDefaults.variant,
    onDismiss,
    dismissLabel = alertDefaults.dismissLabel,
    className,
    ...rest
  },
  ref,
) {
  const tone = tones[variant];
  const { Icon } = tone;
  // Warnings and errors interrupt a screen reader; the rest wait for a pause.
  const urgent = variant === "warning" || variant === "danger";
  return (
    <div
      {...rest}
      ref={ref}
      role={urgent ? "alert" : "status"}
      className={cx(
        "flex items-start gap-3 rounded-[var(--rd-radius-overlay)] border p-3.5 " +
          "text-sm leading-relaxed text-[var(--rd-color-text-default)] [box-shadow:var(--rd-elevation-raised)]",
        tone.box,
        className,
      )}
    >
      <Icon className={cx("mt-0.5 size-5 shrink-0", tone.icon)} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Said in words, so the tone isn't only a color and an icon. */}
        <span className="sr-only">{tone.say}: </span>
        {title && <p className="font-medium">{title}</p>}
        <div>{children}</div>
      </div>
      {onDismiss && (
        <AriaButton
          aria-label={dismissLabel}
          onPress={onDismiss}
          className={
            "-m-1 flex size-7 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] outline-none " +
            "data-[hovered]:bg-[var(--rd-color-surface-default)]/60 " +
            "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
          }
        >
          <CloseIcon className="size-4" />
        </AriaButton>
      )}
    </div>
  );
});
