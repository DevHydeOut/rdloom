"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { Button as AriaButton } from "react-aria-components";
import { pullToRefreshDefaults, type PullToRefreshSpecProps } from "../generated/pull-to-refresh.types";
import { cx } from "../utils/cx";
import { ArrowDownIcon, RetryIcon } from "../utils/icons";
import { Spinner } from "../spinner/spinner";
import { FAILED_HEIGHT, HOLD_RATIO, MAX_PULL_RATIO, PULL_LOCK_PX, arrowProgress, phaseOf, pullDistance } from "./pull";

export interface PullToRefreshProps extends PullToRefreshSpecProps {
  className?: string;
}

/** The parts of the pull to refresh that take a class name of their own. */
export type PullToRefreshSlot = "root" | "indicator" | "content" | "button";
export type PullToRefreshClassNames = Partial<Record<PullToRefreshSlot, string>>;

const words = {
  pull: "Pull to refresh",
  release: "Release to refresh",
  refreshing: "Refreshing",
  done: "Updated",
  error: "Could not refresh",
  retry: "Try again",
  button: "Refresh",
} as const;

const focusRing = "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

/**
 * Pull the content down at the top to load it again. The pull is a shortcut: a Refresh button does the
 * same for the keyboard and screen readers. The component loads nothing itself: `onRefresh` does, and
 * the indicator stays until the promise it returns settles.
 */
export const PullToRefresh = forwardRef<HTMLDivElement, PullToRefreshProps>(function PullToRefresh(
  {
    children,
    onRefresh,
    onError,
    isRefreshing = pullToRefreshDefaults.isRefreshing,
    threshold = pullToRefreshDefaults.threshold,
    scrollElement = pullToRefreshDefaults.scrollElement,
    isDisabled = pullToRefreshDefaults.isDisabled,
    labels,
    classNames,
    className,
  },
  forwardedRef,
) {
  const text = { ...words, ...labels };
  const root = useRef<HTMLDivElement | null>(null);

  // The pull in progress (the distance the content has moved) and the refresh state.
  const [distance, setDistance] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<"done" | "failed" | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const distanceRef = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // The newest props, read by the touch listeners without re-attaching them on every render.
  const latest = useRef({ onRefresh, onError, threshold, scrollElement });
  latest.current = { onRefresh, onError, threshold, scrollElement };

  const refresh = async () => {
    if (busy.current) return;
    busy.current = true;
    setOutcome(null);
    setRunning(true);
    try {
      await latest.current.onRefresh();
      if (mounted.current) setOutcome("done");
    } catch (error) {
      if (mounted.current) setOutcome("failed");
      latest.current.onError?.(error);
    } finally {
      busy.current = false;
      if (mounted.current) {
        setRunning(false);
        distanceRef.current = 0;
        setDistance(0);
      }
    }
  };

  useEffect(() => {
    const el = root.current;
    if (!el || isDisabled) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;
    let locked = false;

    const atTop = () => (latest.current.scrollElement === "window" ? window.scrollY <= 0 : el.scrollTop <= 0);
    const settle = () => {
      tracking = false;
      locked = false;
      distanceRef.current = 0;
      setPulling(false);
      setDistance(0);
    };

    const start = (e: TouchEvent) => {
      // One finger, at the top, with nothing already loading.
      if (busy.current || e.touches.length !== 1 || !atTop()) {
        tracking = false;
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
      locked = false;
    };

    const move = (e: TouchEvent) => {
      if (!tracking) return;
      const dy = e.touches[0].clientY - startY;
      const dx = e.touches[0].clientX - startX;
      if (!locked) {
        if (Math.abs(dy) < PULL_LOCK_PX && Math.abs(dx) < PULL_LOCK_PX) return;
        // Upward, or mostly sideways: this is scrolling or a swipe, not a pull.
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
          tracking = false;
          return;
        }
        locked = true;
        setPulling(true);
      }
      // Scrolled away from the top meanwhile (a momentum scroll that finished late): give the gesture back.
      if (!atTop()) {
        settle();
        return;
      }
      // Stop the browser's own overscroll or refresh while we are pulling.
      if (e.cancelable) e.preventDefault();
      const next = pullDistance(dy - PULL_LOCK_PX, latest.current.threshold * MAX_PULL_RATIO);
      distanceRef.current = next;
      setDistance(next);
    };

    const end = () => {
      if (!tracking) return;
      const wasPulling = locked;
      const past = distanceRef.current >= latest.current.threshold;
      settle();
      if (wasPulling && past) void refresh();
    };

    el.addEventListener("touchstart", start, { passive: true });
    // Not passive, so the browser's scrolling can be stopped while pulling.
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", settle);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", settle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisabled]);

  const refreshing = running || isRefreshing;
  const failed = outcome === "failed" && !refreshing && distance === 0;
  const phase = phaseOf(distance, threshold, refreshing);
  // How far the content sits below the top: following the finger, held while loading, or showing the error.
  const offset = refreshing && !pulling ? threshold * HOLD_RATIO : failed ? FAILED_HEIGHT : distance;
  const progress = arrowProgress(distance, threshold);

  const message = phase === "refreshing" ? text.refreshing : phase === "ready" ? text.release : phase === "pulling" ? text.pull : failed ? text.error : "";
  // What a screen reader is told: the state while loading, then the result.
  const announcement = refreshing ? text.refreshing : outcome === "done" ? text.done : outcome === "failed" ? text.error : "";

  return (
    <div
      ref={(node) => {
        root.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      data-phase={phase}
      data-failed={failed || undefined}
      aria-busy={refreshing || undefined}
      className={cx("relative isolate", scrollElement === "self" && "overflow-y-auto overscroll-y-contain", scrollElement === "window" && "overflow-hidden", className, classNames?.root)}
    >
      {/* The keyboard and screen reader way to refresh; it shows when it has focus. */}
      {!isDisabled && (
        <AriaButton
          aria-disabled={refreshing || undefined}
          onPress={() => {
            if (!refreshing) void refresh();
          }}
          className={cx(
            "sr-only data-[focus-visible]:not-sr-only data-[focus-visible]:absolute data-[focus-visible]:end-2 data-[focus-visible]:top-2 data-[focus-visible]:z-20",
            "rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-3 py-2 text-xs font-medium text-[var(--rd-color-text-default)]",
            focusRing,
            classNames?.button,
          )}
        >
          {text.button}
        </AriaButton>
      )}
      <div role="status" className="sr-only">
        {announcement}
      </div>
      {/* Revealed above the content as it moves down. */}
      <div
        aria-hidden={failed ? undefined : "true"}
        style={{ height: offset }}
        className={cx(
          "absolute inset-x-0 top-0 flex items-center justify-center gap-2 overflow-hidden text-sm text-[var(--rd-color-text-muted)]",
          failed && "text-[var(--rd-color-text-default)]",
          classNames?.indicator,
        )}
      >
        {offset > 0 && (
          <>
            {phase === "refreshing" ? (
              <Spinner decorative size="sm" />
            ) : failed ? (
              <RetryIcon className="size-4 shrink-0 text-[var(--rd-color-feedback-danger)]" />
            ) : (
              <span aria-hidden="true" style={{ transform: `rotate(${Math.round(progress * 180)}deg)` }} className="flex shrink-0">
                <ArrowDownIcon />
              </span>
            )}
            {message && <span>{message}</span>}
            {failed && (
              <AriaButton
                onPress={() => void refresh()}
                className={cx("ms-2 rounded-[var(--rd-radius-control)] px-2 py-1 text-sm font-medium text-[var(--rd-color-action-primary)] underline", focusRing)}
              >
                {text.retry}
              </AriaButton>
            )}
          </>
        )}
      </div>
      <div
        style={{ transform: offset === 0 ? undefined : `translateY(${offset}px)` }}
        className={cx("relative bg-[var(--rd-color-surface-default)]", !pulling && "transition-transform duration-200 ease-out motion-reduce:transition-none", classNames?.content)}
      >
        {children}
      </div>
    </div>
  );
});
