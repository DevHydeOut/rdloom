"use client";

import { forwardRef, useId } from "react";
import { TooltipTrigger } from "react-aria-components";
import { actionButtonDefaults, type ActionButtonSpecProps } from "../generated/action-button.types";
import { AlertDialog } from "../alert-dialog/alert-dialog";
import { Button } from "../button/button";
import { DialogTrigger } from "../dialog/dialog";
import { Tooltip } from "../tooltip/tooltip";
import { cx } from "../utils/cx";
import { resolvePermission } from "../utils/permissions";
import { useAction } from "./use-action";

export interface ActionButtonProps extends ActionButtonSpecProps {
  className?: string;
}

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
  {
    children,
    onAction,
    permission,
    confirm,
    variant = actionButtonDefaults.variant,
    size = actionButtonDefaults.size,
    icon,
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    onStateChange,
    className,
  },
  ref,
) {
  const { state, run, isPending } = useAction(onAction, { onSuccess, onError, onStateChange });
  const reasonId = useId();
  const access = resolvePermission(permission);
  if (!access.isVisible) return null;

  const message = state === "success" ? successMessage : state === "error" ? errorMessage : undefined;
  const status = (
    <span role="status" className="sr-only">
      {message}
    </span>
  );
  const label = (
    <>
      {icon && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {icon}
        </span>
      )}
      {children}
    </>
  );

  if (access.isDisabled) {
    if (!access.reason) {
      return (
        <>
          <Button ref={ref} variant={variant} size={size} isDisabled className={className}>
            {label}
          </Button>
          {status}
        </>
      );
    }
    // Looks disabled but stays in the tab order, so the reason can be reached by keyboard.
    return (
      <>
        <TooltipTrigger>
          <Button
            ref={ref}
            variant={variant}
            size={size}
            aria-disabled="true"
            aria-describedby={reasonId}
            className={cx("opacity-50 cursor-not-allowed", className)}
            onPress={() => {}}
          >
            {label}
          </Button>
          <Tooltip>{access.reason}</Tooltip>
        </TooltipTrigger>
        <span id={reasonId} className="sr-only">
          {access.reason}
        </span>
        {status}
      </>
    );
  }

  if (confirm) {
    return (
      <>
        <DialogTrigger>
          <Button ref={ref} variant={variant} size={size} isLoading={isPending} className={className}>
            {label}
          </Button>
          <AlertDialog
            tone={variant === "danger" ? "danger" : "default"}
            title={confirm.title}
            description={confirm.description}
            confirmLabel={confirm.confirmLabel}
            cancelLabel={confirm.cancelLabel}
            confirmText={confirm.confirmText}
            onConfirm={run}
          />
        </DialogTrigger>
        {status}
      </>
    );
  }

  return (
    <>
      <Button ref={ref} variant={variant} size={size} isLoading={isPending} className={className} onPress={() => void run()}>
        {label}
      </Button>
      {status}
    </>
  );
});
