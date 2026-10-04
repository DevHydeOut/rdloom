import { forwardRef } from "react";
import {
  Button,
  Dialog as AriaDialog,
  Heading,
  Modal,
  ModalOverlay,
  type DialogProps as AriaDialogProps,
} from "react-aria-components";
import { sheetDefaults, type SheetSpecProps } from "../generated/sheet.types";
import { cx } from "../utils/cx";
import { CloseIcon } from "../utils/icons";

export interface SheetProps
  extends SheetSpecProps,
    Omit<AriaDialogProps, keyof SheetSpecProps | "className" | "children"> {
  className?: string;
  /** Controlled open state, for sheets opened without a DialogTrigger. */
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

type Side = NonNullable<SheetSpecProps["side"]>;
type Size = NonNullable<SheetSpecProps["size"]>;

// Logical sides (start/end), so the sheet follows right-to-left layouts.
const placement: Record<Side, string> = {
  end: "inset-y-0 end-0 h-full border-s",
  start: "inset-y-0 start-0 h-full border-e",
  bottom: "inset-x-0 bottom-0 max-h-[85vh] w-full border-t rounded-t-[var(--rd-radius-overlay)]",
};

const sizes: Record<Side, Record<Size, string>> = {
  end: { sm: "w-full max-w-xs", md: "w-full max-w-md", lg: "w-full max-w-2xl" },
  start: { sm: "w-full max-w-xs", md: "w-full max-w-md", lg: "w-full max-w-2xl" },
  bottom: { sm: "h-1/3", md: "h-1/2", lg: "h-[85vh]" },
};

// Slide in from the chosen edge. motion-reduce turns it off.
const slide: Record<Side, string> = {
  end: "data-[entering]:animate-[rd-sheet-end_200ms_ease-out] rtl:data-[entering]:animate-[rd-sheet-start_200ms_ease-out]",
  start: "data-[entering]:animate-[rd-sheet-start_200ms_ease-out] rtl:data-[entering]:animate-[rd-sheet-end_200ms_ease-out]",
  bottom: "data-[entering]:animate-[rd-sheet-bottom_200ms_ease-out]",
};

const keyframes = `
@keyframes rd-sheet-end { from { transform: translateX(100%); } }
@keyframes rd-sheet-start { from { transform: translateX(-100%); } }
@keyframes rd-sheet-bottom { from { transform: translateY(100%); } }
@keyframes rd-sheet-fade { from { opacity: 0; } }`;

export const Sheet = forwardRef<HTMLElement, SheetProps>(function Sheet(
  {
    title,
    description,
    side = sheetDefaults.side,
    size = sheetDefaults.size,
    isDismissable = sheetDefaults.isDismissable,
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
      className="fixed inset-0 z-50 bg-[var(--rd-color-overlay-backdrop)] data-[entering]:animate-[rd-sheet-fade_200ms] motion-reduce:animate-none"
    >
      <style>{keyframes}</style>
      <Modal
        className={cx(
          "fixed flex flex-col overflow-hidden shadow-xl bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] border-[var(--rd-color-border-default)]",
          "motion-reduce:!animate-none",
          placement[side],
          sizes[side][size],
          slide[side],
        )}
      >
        <AriaDialog {...rest} ref={ref} className={cx("flex h-full min-h-0 flex-col outline-none", className)}>
          {(renderProps) => (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-[var(--rd-color-border-default)] p-5">
                <div className="flex flex-col gap-1">
                  <Heading slot="title" className="text-lg font-semibold">
                    {title}
                  </Heading>
                  {description && <p className="text-sm text-[var(--rd-color-text-muted)]">{description}</p>}
                </div>
                <Button
                  slot="close"
                  aria-label="Close"
                  className="flex size-8 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] text-[var(--rd-color-text-muted)] outline-none data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
                >
                  <CloseIcon className="size-4" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                {typeof children === "function" ? children(renderProps) : children}
              </div>
            </>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
});
