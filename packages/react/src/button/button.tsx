"use client";

import { forwardRef } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { buttonDefaults, type ButtonSpecProps } from "../generated/button.types";
import { cx } from "../utils/cx";
import { Spinner } from "../utils/icons";

// This file is the styled layer: the CLI copies it into user projects and
// they own it. Behavior and accessibility come from react-aria-components.

export interface ButtonProps
  extends ButtonSpecProps,
    Omit<AriaButtonProps, keyof ButtonSpecProps | "isPending" | "className" | "children"> {
  className?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold tracking-[-0.005em] select-none whitespace-nowrap " +
  "rounded-[var(--rd-radius-control)] transition-[background-color,border-color,box-shadow,transform] outline-none " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] " +
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[pending]:cursor-wait";

const variants: Record<NonNullable<ButtonSpecProps["variant"]>, string> = {
  primary:
    "bg-[var(--rd-color-action-primary)] text-[var(--rd-color-action-on-primary)] [box-shadow:var(--rd-elevation-control)] " +
    "data-[hovered]:bg-[var(--rd-color-action-primary-hover)] data-[pressed]:translate-y-px data-[pressed]:[box-shadow:none]",
  secondary:
    "bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] border border-[var(--rd-color-border-default)] " +
    "[box-shadow:var(--rd-elevation-raised)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:border-[var(--rd-color-border-strong)] data-[pressed]:translate-y-px",
  ghost:
    "bg-transparent text-[var(--rd-color-text-default)] data-[hovered]:bg-[var(--rd-color-surface-subtle)]",
  danger:
    "bg-[var(--rd-color-action-danger)] text-[var(--rd-color-action-on-primary)] [box-shadow:var(--rd-elevation-control)] " +
    "data-[hovered]:bg-[var(--rd-color-action-danger-hover)] data-[pressed]:translate-y-px data-[pressed]:[box-shadow:none]",
};

const sizes: Record<NonNullable<ButtonSpecProps["size"]>, string> = {
  sm: "h-[var(--rd-size-control-sm)] px-[var(--rd-space-control-x-sm)] text-sm",
  md: "h-[var(--rd-size-control-md)] px-[var(--rd-space-control-x)] text-sm",
  lg: "h-[var(--rd-size-control-lg)] px-[var(--rd-space-control-x-lg)] text-base",
};

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
      {isLoading && <Spinner className="size-4" />}
      {children}
    </AriaButton>
  );
});
