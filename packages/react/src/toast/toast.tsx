"use client";

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
import { CloseIcon, ErrorIcon, InfoIcon, SuccessIcon } from "../utils/icons";

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

// Each tone has its own icon shape and tinted badge, so it never depends on color alone.
const tones: Record<NonNullable<ToastSpecProps["variant"]>, { badge: string; Icon: typeof InfoIcon }> = {
  neutral: { badge: "bg-[var(--rd-color-feedback-info-subtle)] text-[var(--rd-color-feedback-info)]", Icon: InfoIcon },
  success: { badge: "bg-[var(--rd-color-feedback-success-subtle)] text-[var(--rd-color-feedback-success)]", Icon: SuccessIcon },
  danger: { badge: "bg-[var(--rd-color-feedback-danger-subtle)] text-[var(--rd-color-feedback-danger)]", Icon: ErrorIcon },
};

export function ToastRegion({ className }: { className?: string }) {
  return (
    <AriaToastRegion
      queue={toastQueue}
      className={cx("fixed right-4 bottom-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col-reverse gap-3 outline-none", className)}
    >
      {({ toast: item }) => {
        const { badge, Icon } = tones[item.content.variant ?? toastDefaults.variant];
        return (
          <AriaToast
            toast={item}
            className={cx(
              "flex items-start gap-3 p-4 outline-none [box-shadow:var(--rd-elevation-floating)] " +
                "bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] " +
                "border border-[var(--rd-color-border-default)] rounded-2xl " +
                // Slide up and fade in; slide out and fade on dismiss. A reduced-motion visitor gets no movement.
                "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none " +
                "data-[animation=queued]:translate-y-3 data-[animation=queued]:opacity-0 " +
                "data-[animation=exiting]:translate-x-6 data-[animation=exiting]:opacity-0 " +
                "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
            )}
          >
            <span aria-hidden="true" className={cx("flex size-8 shrink-0 items-center justify-center rounded-full", badge)}>
              <Icon className="size-4" />
            </span>
            <AriaToastContent className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
              <Text slot="title" className="text-sm leading-5 font-semibold">
                {item.content.title}
              </Text>
              {item.content.description && (
                <Text slot="description" className="text-[13px] leading-5 text-[var(--rd-color-text-muted)]">
                  {item.content.description}
                </Text>
              )}
            </AriaToastContent>
            <Button
              slot="close"
              aria-label="Dismiss"
              className={
                "-me-1 -mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] text-[var(--rd-color-text-muted)] outline-none data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] " +
                "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
              }
            >
              <CloseIcon className="size-4" />
            </Button>
          </AriaToast>
        );
      }}
    </AriaToastRegion>
  );
}
