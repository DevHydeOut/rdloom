import {
  Button,
  Text,
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as AriaToastContent,
  UNSTABLE_ToastQueue as AriaToastQueue,
  UNSTABLE_ToastRegion as AriaToastRegion,
} from "react-aria-components";
import { toastDefaults, type ToastSpecProps } from "../generated/toast.types";
import { cx } from "../utils/cx";

// React Aria's toast API is still marked UNSTABLE_. Everything that touches
// it lives in this file, so an upstream rename is a one-file fix.

type ToastContent = Pick<ToastSpecProps, "title" | "description" | "variant">;

/** One queue per app. Render <ToastRegion /> once, near the root. */
export const toastQueue = new AriaToastQueue<ToastContent>({ maxVisibleToasts: 5 });

/** Shows a toast. Returns its key, which can be passed to toastQueue.close(). */
export function toast({ timeout = toastDefaults.timeout, ...content }: ToastSpecProps): string {
  return toastQueue.add(
    { variant: toastDefaults.variant, ...content },
    { timeout: timeout > 0 ? timeout : undefined },
  );
}

const accents: Record<NonNullable<ToastSpecProps["variant"]>, string> = {
  neutral: "before:bg-[var(--rd-color-border-default)]",
  success: "before:bg-[var(--rd-color-feedback-success)]",
  danger: "before:bg-[var(--rd-color-feedback-danger)]",
};

export function ToastRegion({ className }: { className?: string }) {
  return (
    <AriaToastRegion
      queue={toastQueue}
      className={cx("fixed bottom-4 right-4 z-50 flex w-80 flex-col-reverse gap-2 outline-none", className)}
    >
      {({ toast: item }) => (
        <AriaToast
          toast={item}
          className={cx(
            "relative flex items-start gap-3 overflow-hidden p-4 pl-5 shadow-lg outline-none " +
              "bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] " +
              "border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-overlay)] " +
              "before:absolute before:inset-y-0 before:left-0 before:w-1 " +
              "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
            accents[item.content.variant ?? toastDefaults.variant],
          )}
        >
          <AriaToastContent className="flex flex-1 flex-col gap-0.5">
            <Text slot="title" className="text-sm font-medium">
              {item.content.title}
            </Text>
            {item.content.description && (
              <Text slot="description" className="text-xs text-[var(--rd-color-text-muted)]">
                {item.content.description}
              </Text>
            )}
          </AriaToastContent>
          <Button
            slot="close"
            aria-label="Dismiss"
            className={
              "rounded p-0.5 text-[var(--rd-color-text-muted)] outline-none data-[hovered]:text-[var(--rd-color-text-default)] " +
              "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
            }
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Button>
        </AriaToast>
      )}
    </AriaToastRegion>
  );
}
