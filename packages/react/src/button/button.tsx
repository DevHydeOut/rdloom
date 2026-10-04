"use client";

import { forwardRef } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { buttonDefaults, type ButtonSpecProps } from "../generated/button.types";
import { cx } from "../utils/cx";

// This file is the styled layer: the CLI copies it into user projects and
// they own it. Behavior and accessibility come from react-aria-components.

export interface ButtonProps
  extends ButtonSpecProps,
    Omit<AriaButtonProps, keyof ButtonSpecProps | "isPending" | "className" | "children"> {
  className?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium select-none whitespace-nowrap " +
  "rounded-[var(--rd-radius-control)] transition-colors outline-none " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] " +
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[pending]:cursor-wait";

const variants: Record<NonNullable<ButtonSpecProps["variant"]>, string> = {
  primary:
    "bg-[var(--rd-color-action-primary)] text-[var(--rd-color-action-on-primary)] " +
    "data-[hovered]:bg-[var(--rd-color-action-primary-hover)]",
  secondary:
    "bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] border border-[var(--rd-color-border-default)] " +
    "data-[hovered]:bg-[var(--rd-color-surface-subtle)]",
  ghost:
    "bg-transparent text-[var(--rd-color-text-default)] data-[hovered]:bg-[var(--rd-color-surface-subtle)]",
  danger:
    "bg-[var(--rd-color-action-danger)] text-[var(--rd-color-action-on-primary)] " +
    "data-[hovered]:bg-[var(--rd-color-action-danger-hover)]",
};

const sizes: Record<NonNullable<ButtonSpecProps["size"]>, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-[var(--rd-space-control-x)] text-sm",
  lg: "h-12 px-5 text-base",
};

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = buttonDefaults.variant,
    size = buttonDefaults.size,
    isDisabled = buttonDefaults.isDisabled,
    isLoading = buttonDefaults.isLoading,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <AriaButton
      {...rest}
      ref={ref}
      isDisabled={isDisabled}
      // isPending keeps the button focusable and announces the busy state,
      // unlike disabling it while loading.
      isPending={isLoading}
      className={cx(base, variants[variant], sizes[size], className)}
    >
      {isLoading && <Spinner />}
      {children}
    </AriaButton>
  );
});
