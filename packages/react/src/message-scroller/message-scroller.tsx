"use client";

import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button as AriaButton } from "react-aria-components";
import { messageScrollerDefaults, type MessageScrollerSpecProps } from "../generated/message-scroller.types";
import { cx } from "../utils/cx";
import { ArrowDownIcon } from "../utils/icons";

export interface MessageScrollerProps extends MessageScrollerSpecProps {
  className?: string;
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const TOP_ZONE = 40;

/** True when the element is scrolled to within `threshold` pixels of its end. */
export function isNearBottom(el: Pick<HTMLElement, "scrollHeight" | "scrollTop" | "clientHeight">, threshold = 80): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The scrolling region of a conversation. While the reader is at the bottom it follows new
 * content; once they scroll up it stays where it is and offers "Jump to latest". When older
 * messages are added at the top the visible messages do not move.
 */
export const MessageScroller = forwardRef<HTMLDivElement, MessageScrollerProps>(function MessageScroller(
  {
    children,
    label = messageScrollerDefaults.label,
    unreadCount,
    onReachTop,
    isLoadingOlder = messageScrollerDefaults.isLoadingOlder,
    threshold = messageScrollerDefaults.threshold,
    onJumpToLatest,
    onAtBottomChange,
    className,
  },
  forwardedRef,
) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const inner = useRef<HTMLDivElement>(null);
  const stuck = useRef(true);
  const anchor = useRef<{ top: number; height: number } | null>(null);
  const firedTop = useRef(false);
  const [away, setAway] = useState(false);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      scroller.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  const settle = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const height = el.scrollHeight;
    if (stuck.current) {
      el.scrollTop = height;
    } else if (anchor.current && height !== anchor.current.height) {
      // Older content was added above: move down by exactly what was added.
      el.scrollTop = anchor.current.top + (height - anchor.current.height);
      anchor.current = null;
      firedTop.current = false;
    }
  }, []);

  useIsoLayoutEffect(settle, [children, settle]);
  useEffect(() => {
    const el = inner.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(settle);
    observer.observe(el);
    return () => observer.disconnect();
  }, [settle]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const near = isNearBottom(el, threshold);
    if (near !== stuck.current) onAtBottomChange?.(near);
    stuck.current = near;
    setAway(!near);
    if (el.scrollTop > TOP_ZONE) {
      firedTop.current = false;
      anchor.current = null;
    } else if (!firedTop.current && !isLoadingOlder && onReachTop) {
      firedTop.current = true;
      anchor.current = { top: el.scrollTop, height: el.scrollHeight };
      onReachTop();
    }
  };

  const jump = () => {
    const el = scroller.current;
    if (!el) return;
    if (!stuck.current) onAtBottomChange?.(true);
    stuck.current = true;
    setAway(false);
    if (typeof el.scrollTo === "function") el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    else el.scrollTop = el.scrollHeight;
    el.focus({ preventScroll: true });
    onJumpToLatest?.();
  };

  const count = unreadCount && unreadCount > 0 ? unreadCount : 0;

  return (
    <div className={cx("relative h-full min-h-0", className)}>
      <div
        ref={setRefs}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={label}
        aria-busy={isLoadingOlder || undefined}
        tabIndex={0}
        onScroll={onScroll}
        className="h-full overflow-y-auto overscroll-contain px-4 py-4 outline-none motion-reduce:scroll-auto focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--rd-color-focus-ring)]"
      >
        <div ref={inner} className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {isLoadingOlder && (
            <p role="status" className="text-center text-xs text-[var(--rd-color-text-muted)]">
              Loading older messages
            </p>
          )}
          {children}
        </div>
      </div>
      {away && (
        <AriaButton
          onPress={jump}
          className="absolute start-1/2 bottom-3 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[var(--rd-color-border-strong)] bg-[var(--rd-color-surface-raised)] px-3 py-1.5 text-xs font-medium text-[var(--rd-color-text-default)] [box-shadow:var(--rd-elevation-floating)] outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
        >
          <ArrowDownIcon />
          Jump to latest
          {count > 0 && (
            <>
              <span aria-hidden="true" className="min-w-5 rounded-full bg-[var(--rd-color-action-primary)] px-1.5 text-center text-[var(--rd-color-action-on-primary)]">
                {count}
              </span>
              <span className="sr-only">, {count} new {count === 1 ? "message" : "messages"}</span>
            </>
          )}
        </AriaButton>
      )}
    </div>
  );
});
