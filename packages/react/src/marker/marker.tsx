"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { Button as AriaButton } from "react-aria-components";
import { markerDefaults, type MarkerSpecProps } from "../generated/marker.types";
import { cx } from "../utils/cx";

export interface MarkerProps
  extends MarkerSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof MarkerSpecProps | "className" | "children" | "role"> {
  className?: string;
}

/**
 * A labelled divider inside a conversation. On its own it is a separator named by its label. With
 * onJump it is a labelled group holding a real button, since a separator cannot contain controls.
 */
export const Marker = forwardRef<HTMLDivElement, MarkerProps>(function Marker(
  { label, variant = markerDefaults.variant, dateTime, onJump, jumpLabel, className, ...rest },
  ref,
) {
  const unread = variant === "unread";
  const jump = unread && !!onJump;
  const lineClass = cx("h-px flex-1", unread ? "bg-[var(--rd-color-action-primary)]" : "bg-[var(--rd-color-border-default)]");
  const textClass = cx(
    "shrink-0 text-center text-xs",
    variant !== "event" && "font-medium",
    unread ? "text-[var(--rd-color-action-primary)]" : "text-[var(--rd-color-text-muted)]",
  );
  const text = dateTime ? <time dateTime={dateTime}>{label}</time> : label;

  return (
    <div
      {...rest}
      ref={ref}
      role={jump ? "group" : "separator"}
      aria-label={label}
      data-variant={variant}
      className={cx("flex w-full items-center gap-3 py-1", className)}
    >
      <span aria-hidden="true" className={lineClass} />
      {jump ? (
        <AriaButton
          onPress={onJump}
          aria-label={jumpLabel}
          className={cx(
            textClass,
            "rounded-[var(--rd-radius-control)] px-2 py-0.5 outline-none data-[hovered]:underline data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
          )}
        >
          {text}
        </AriaButton>
      ) : (
        <span className={textClass}>{text}</span>
      )}
      <span aria-hidden="true" className={lineClass} />
    </div>
  );
});
