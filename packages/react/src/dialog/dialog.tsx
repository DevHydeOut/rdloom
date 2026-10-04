import { forwardRef } from "react";
import {
  Dialog as AriaDialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
  type DialogProps as AriaDialogProps,
} from "react-aria-components";
import { dialogDefaults, type DialogSpecProps } from "../generated/dialog.types";
import { cx } from "../utils/cx";

export { DialogTrigger };

export interface DialogProps
  extends DialogSpecProps,
    Omit<AriaDialogProps, keyof DialogSpecProps | "className" | "children"> {
  className?: string;
  /** Controlled open state, for dialogs opened without a DialogTrigger. */
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

const widths: Record<NonNullable<DialogSpecProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export const Dialog = forwardRef<HTMLElement, DialogProps>(function Dialog(
  {
    title,
    description,
    size = dialogDefaults.size,
    role = dialogDefaults.role,
    isDismissable = dialogDefaults.isDismissable,
    isOpen,
    onOpenChange,
    children,
    className,
    ...rest
  },
  ref,
) {
  return (
    <ModalOverlay
      isDismissable={isDismissable}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--rd-color-overlay-backdrop)]"
    >
      <Modal
        className={cx(
          "w-full overflow-hidden shadow-xl bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] " +
            "border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-overlay)]",
          widths[size],
        )}
      >
        <AriaDialog {...rest} ref={ref} role={role} className={cx("flex flex-col gap-4 p-6 outline-none", className)}>
          {(renderProps) => (
            <>
              <div className="flex flex-col gap-1">
                <Heading slot="title" className="text-lg font-semibold">
                  {title}
                </Heading>
                {description && <p className="text-sm text-[var(--rd-color-text-muted)]">{description}</p>}
              </div>
              {typeof children === "function" ? children(renderProps) : children}
            </>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
});
