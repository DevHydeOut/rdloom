"use client";

import { Children, cloneElement, forwardRef, isValidElement, type HTMLAttributes, type ReactElement } from "react";
import { Button as AriaButton } from "react-aria-components";
import { bubbleDefaults, type BubbleSpecProps } from "../generated/bubble.types";
import { cx } from "../utils/cx";
import { ErrorIcon, RetryIcon } from "../utils/icons";

export interface BubbleProps
  extends BubbleSpecProps,
    Omit<HTMLAttributes<HTMLElement>, keyof BubbleSpecProps | "className" | "role" | "children"> {
  className?: string;
}

const focusRing = "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

function timeText(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * The chrome around one plain chat message: who sent it, when, whether it arrived, and what you can
 * do with it. It does not render structured replies (tools, charts, sources): that is Message. Use
 * Bubble for simple text chats, or put formatted text inside it.
 */
export const Bubble = forwardRef<HTMLElement, BubbleProps>(function Bubble(
  {
    from = bubbleDefaults.from,
    position = bubbleDefaults.position,
    name,
    avatar,
    timestamp,
    timestampText,
    status = bubbleDefaults.status,
    onRetry,
    actions,
    attachments,
    children,
    className,
    ...rest
  },
  ref,
) {
  const mine = from === "user";
  const showName = !!name && (position === "single" || position === "first");
  const showAvatar = position === "single" || position === "last";
  const hasAvatarColumn = !!avatar;
  const joinedAbove = position === "middle" || position === "last";
  const joinedBelow = position === "first" || position === "middle";
  const failed = status === "failed";
  const visibleTime = timestamp !== undefined ? (timestampText ?? timeText(timestamp)) : undefined;
  const hasFooter = timestamp !== undefined || status !== "sent" || !!actions;

  // The corners that touch the neighbouring bubble go square on the side the bubble is anchored to.
  const corners = mine
    ? cx(joinedAbove && "rounded-se-md", joinedBelow && "rounded-ee-md")
    : cx(joinedAbove && "rounded-ss-md", joinedBelow && "rounded-es-md");

  return (
    <article
      {...rest}
      ref={ref}
      aria-label={`${name ?? (mine ? "You" : "Assistant")} message`}
      data-from={from}
      data-position={position}
      data-status={status}
      className={cx(
        "flex w-full flex-col gap-1",
        // Standalone bubbles (and the first of a run) sit 12px below what comes before; bubbles
        // inside a run stay 2px apart. A flex column parent keeps both margins from collapsing.
        position === "single" || position === "first" ? "mt-4 first:mt-0" : "mt-1.5",
        mine ? "items-end" : "items-start",
        className,
      )}
    >
      {showName && (
        <span className={cx("px-1 text-xs font-medium text-[var(--rd-color-text-muted)]", hasAvatarColumn && !mine && "ms-10")}>{name}</span>
      )}
      <div className={cx("flex max-w-[85%] min-w-0 gap-2", mine ? "flex-row-reverse" : "flex-row", "items-end")}>
        {hasAvatarColumn && <div className="flex w-8 shrink-0 items-end">{showAvatar ? avatar : null}</div>}
        <div
          className={cx(
            "flex min-w-0 flex-col gap-2 rounded-[var(--rd-radius-overlay)] px-3.5 py-2 text-sm break-words",
            mine
              ? "bg-[var(--rd-color-action-primary)] text-[var(--rd-color-action-on-primary)]"
              : "bg-[var(--rd-color-surface-subtle)] text-[var(--rd-color-text-default)] ring-1 ring-[var(--rd-color-border-default)]",
            status === "sending" && "opacity-70",
            failed && "ring-2 ring-[var(--rd-color-feedback-danger)]",
            corners,
          )}
        >
          {children}
          {attachments}
        </div>
      </div>
      {hasFooter && (
        <div
          className={cx(
            "flex min-h-6 max-w-[85%] flex-wrap items-center gap-x-2 gap-y-1 px-1 text-xs leading-none text-[var(--rd-color-text-muted)]",
            hasAvatarColumn && !mine && "ms-10",
            mine && "justify-end",
          )}
        >
          {timestamp !== undefined && (
            <time dateTime={timestamp instanceof Date ? timestamp.toISOString() : timestamp}>{visibleTime}</time>
          )}
          {status === "sending" && <span role="status">Sending</span>}
          {failed && (
            <span role="alert" className="inline-flex items-center gap-1.5 text-[var(--rd-color-feedback-danger)]">
              <ErrorIcon className="size-3.5 shrink-0" />
              Not sent
              {onRetry && (
                <AriaButton
                  onPress={onRetry}
                  className={cx("inline-flex min-h-6 items-center gap-1 rounded px-1 font-medium underline underline-offset-2", focusRing)}
                >
                  <RetryIcon className="size-3.5 shrink-0" />
                  Retry
                </AriaButton>
              )}
            </span>
          )}
          {actions && (
            <div className="flex items-center gap-1 [&_button]:!h-6 [&_button]:!min-h-0 [&_button]:!px-2 [&_button]:!text-xs">{actions}</div>
          )}
        </div>
      )}
    </article>
  );
});

export interface BubbleGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "className" | "role"> {
  className?: string;
}

/** A run of consecutive bubbles from one sender. It sets each bubble's position so the touching corners merge. */
export const BubbleGroup = forwardRef<HTMLDivElement, BubbleGroupProps>(function BubbleGroup(
  { className, children, ...rest },
  ref,
) {
  const items = Children.toArray(children).filter((c): c is ReactElement<BubbleProps> => isValidElement(c));
  const last = items.length - 1;
  return (
    <div {...rest} ref={ref} role="group" className={cx("flex flex-col mt-4 first:mt-0", className)}>
      {items.map((item, i) =>
        cloneElement(item, { position: last === 0 ? "single" : i === 0 ? "first" : i === last ? "last" : "middle" }),
      )}
    </div>
  );
});

export interface BubbleListProps extends Omit<HTMLAttributes<HTMLDivElement>, "className" | "role"> {
  className?: string;
}

/**
 * A conversation: bubbles and groups one after another with 12px between them. Each child becomes a
 * list item, so a screen reader announces the number of messages. Use it instead of a bare column when
 * you want the spacing to come with the component.
 */
export const BubbleList = forwardRef<HTMLDivElement, BubbleListProps>(function BubbleList(
  { className, children, ...rest },
  ref,
) {
  return (
    <div {...rest} ref={ref} role="list" className={cx("flex flex-col gap-4", className)}>
      {Children.toArray(children).map((child, i) => (
        <div key={isValidElement(child) && child.key != null ? child.key : i} role="listitem" className="[&>*]:!mt-0">
          {child}
        </div>
      ))}
    </div>
  );
});
