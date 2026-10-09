"use client";

import { forwardRef, useCallback, useEffect, useRef, useState, type HTMLAttributes, type PointerEvent } from "react";
import { hyperTextDefaults, type HyperTextSpecProps } from "../generated/hyper-text.types";
import { cx } from "../utils/cx";
import { prefersReducedMotion, useReducedMotion } from "../utils/motion";

export interface HyperTextProps
  extends HyperTextSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof HyperTextSpecProps | "className" | "children"> {
  className?: string;
}

const STEP_MS = 50;
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

const pick = (pool: string) => pool[Math.floor(Math.random() * pool.length)];

/** A random stand-in of the same kind (upper, lower, digit); anything else (spaces, punctuation) stays. */
function stand(ch: string): string {
  if (/[A-Z]/.test(ch)) return pick(UPPER);
  if (/[a-z]/.test(ch)) return pick(LOWER);
  if (/[0-9]/.test(ch)) return pick(DIGITS);
  return ch;
}

/**
 * Letters scramble and settle, left to right, on the real text. The final text is always in the server
 * HTML and in a visually hidden copy; the scrambling copy is hidden from assistive technology. Runs
 * once in view and again on hover; reduced motion and isPaused never scramble.
 */
export const HyperText = forwardRef<HTMLSpanElement, HyperTextProps>(function HyperText(
  {
    children,
    duration = hyperTextDefaults.duration,
    whenInView = hyperTextDefaults.whenInView,
    onHover = hyperTextDefaults.onHover,
    isPaused = hyperTextDefaults.isPaused,
    className,
    onPointerEnter,
    ...rest
  },
  forwarded,
) {
  const node = useRef<HTMLSpanElement | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const reduced = useReducedMotion();
  const still = isPaused || reduced;
  const [shown, setShown] = useState(children);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  const run = useCallback(() => {
    stop();
    if (still || prefersReducedMotion()) return;
    const letters = Array.from(children);
    const steps = Math.max(1, Math.round(duration / STEP_MS));
    let tick = 0;
    timer.current = setInterval(() => {
      tick++;
      if (tick >= steps) {
        stop();
        setShown(children);
        return;
      }
      const settled = Math.floor((tick / steps) * letters.length);
      setShown(letters.map((ch, i) => (i < settled ? ch : stand(ch))).join(""));
    }, STEP_MS);
  }, [children, duration, still, stop]);

  useEffect(() => {
    stop();
    setShown(children);
  }, [children, still, stop]);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    const el = node.current;
    if (!whenInView || still || !el || typeof IntersectionObserver === "undefined") return;
    const watcher = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      watcher.disconnect();
      run();
    });
    watcher.observe(el);
    return () => watcher.disconnect();
  }, [whenInView, still, run]);

  return (
    <span
      {...rest}
      ref={(el) => {
        node.current = el;
        if (typeof forwarded === "function") forwarded(el);
        else if (forwarded) forwarded.current = el;
      }}
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-hyper", className)}
      onPointerEnter={(event: PointerEvent<HTMLSpanElement>) => {
        onPointerEnter?.(event);
        if (onHover) run();
      }}
    >
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
});
