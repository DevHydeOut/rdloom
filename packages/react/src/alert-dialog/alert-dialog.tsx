"use client";

import { forwardRef, useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { alertDialogDefaults, type AlertDialogSpecProps } from "../generated/alert-dialog.types";
import { Button } from "../button/button";
import { TextField } from "../text-field/text-field";
import { cx } from "../utils/cx";

export interface AlertDialogProps extends AlertDialogSpecProps {
  className?: string;
}

export const AlertDialog = forwardRef<HTMLElement, AlertDialogProps>(function AlertDialog(
  {
    title,
    description,
    confirmLabel = alertDialogDefaults.confirmLabel,
    cancelLabel = alertDialogDefaults.cancelLabel,
    tone = alertDialogDefaults.tone,
    confirmText,
    onConfirm,
    onCancel,
    isOpen,
    defaultOpen,
    onOpenChange,
    className,
  },
  ref,
) {
  const descriptionId = useId();
  const [pending, setPending] = useState(false);
  const [typed, setTyped] = useState("");
  const danger = tone === "danger";
  const needsText = confirmText != null && confirmText !== "";
  const matches = !needsText || typed === confirmText;

  async function confirm(close: () => void) {
    if (pending || !matches) return;
    let result: void | Promise<void>;
    try {
      result = onConfirm?.();
    } catch (error) {
      setPending(false);
      throw error;
    }
    if (result && typeof (result as Promise<void>).then === "function") {
      setPending(true);
      try {
        await result;
      } catch {
        // A failed confirm leaves the dialog open so the user can retry or cancel.
        setPending(false);
        return;
      }
      setPending(false);
    }
    close();
    setTyped("");
  }

  function cancel(close: () => void) {
    if (pending) return;
    onCancel?.();
    close();
    setTyped("");
  }

  return (
    <ModalOverlay
      isDismissable={false}
      isKeyboardDismissDisabled={pending}
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--rd-color-overlay-backdrop)] backdrop-blur-[2px]"
    >
      <Modal
        className={
          "w-full max-w-sm overflow-hidden [box-shadow:var(--rd-elevation-overlay)] bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] " +
          "border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-overlay)]"
        }
      >
        <AriaDialog
          ref={ref}
          role="alertdialog"
          aria-describedby={description ? descriptionId : undefined}
          className={cx("flex flex-col gap-4 p-6 outline-none", className)}
        >
          {({ close }) => (
            <form
              className="flex flex-col gap-4"
              onSubmit={(event: FormEvent) => {
                event.preventDefault();
                void confirm(close);
              }}
              onKeyDown={(event: KeyboardEvent) => {
                // The modal closes itself on Escape; report it as a cancel.
                if (event.key === "Escape" && !pending) {
                  onCancel?.();
                  setTyped("");
                }
              }}
            >
              <div className="flex flex-col gap-1">
                <Heading slot="title" className="text-lg font-semibold">
                  {title}
                </Heading>
                {description && (
                  <p id={descriptionId} className="text-sm text-[var(--rd-color-text-muted)]">
                    {description}
                  </p>
                )}
              </div>
              {needsText && (
                <TextField
                  label={`Type ${confirmText} to confirm`}
                  value={typed}
                  onChange={setTyped}
                  isDisabled={pending}
                  autoFocus={!danger}
                  autoComplete="off"
                />
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  autoFocus={danger}
                  isDisabled={pending}
                  onPress={() => cancel(close)}
                >
                  {cancelLabel}
                </Button>
                <Button
                  type="submit"
                  variant={danger ? "danger" : "primary"}
                  isLoading={pending}
                  isDisabled={!matches}
                  autoFocus={!danger && !needsText}
                >
                  {confirmLabel}
                </Button>
              </div>
            </form>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
});
