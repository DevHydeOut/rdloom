"use client";

import { forwardRef, useEffect, useMemo, useRef, useState, type HTMLAttributes } from "react";
import { VisuallyHidden } from "react-aria-components";
import { numberTickerDefaults, type NumberTickerSpecProps } from "../generated/number-ticker.types";
import { cx } from "../utils/cx";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "../utils/motion";
import { useDefaultLocale } from "../utils/use-default-locale";

export interface NumberTickerProps
  extends NumberTickerSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof NumberTickerSpecProps | "className" | "children"> {
  className?: string;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A number that counts to its value once after mount. The final number is the text in the server
 * HTML and the only text assistive technology reads; the counting digits are a hidden copy.
 */
export const NumberTicker = forwardRef<HTMLSpanElement, NumberTickerProps>(function NumberTicker(
  {
    value,
    from = numberTickerDefaults.from,
    decimals = numberTickerDefaults.decimals,
    duration = numberTickerDefaults.duration,
    startWhenInView = numberTickerDefaults.startWhenInView,
    locale,
    isPaused = numberTickerDefaults.isPaused,
    className,
    ...rest
  },
  forwarded,
) {
  const resolved = useDefaultLocale(locale);
  const format = useMemo(
    () => new Intl.NumberFormat(resolved, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    [resolved, decimals],
  );
  const inner = useRef<HTMLSpanElement | null>(null);
  const current = useRef(value);
  const [shown, setShown] = useState(value);
  const [armed, setArmed] = useState(false);
  const first = useRef(true);

  // Before the first paint, step back to the start number so the count never flashes the end first.
  useIsomorphicLayoutEffect(() => {
    if (!first.current) return;
    first.current = false;
    if (isPaused || prefersReducedMotion() || from === value) return;
    current.current = from;
    setShown(from);
    setArmed(true);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion()) {
      current.current = value;
      setShown(value);
      return;
    }
    if (!armed && current.current === value) return;
    if (!armed) setArmed(true);
  }, [value, isPaused, armed]);

  useEffect(() => {
    if (!armed) return;
    let frame = 0;
    let watcher: IntersectionObserver | undefined;
    const run = () => {
      const start = current.current;
      const began = performance.now();
      const length = Math.max(duration, 0.01) * 1000;
      const tick = (now: number) => {
        const t = Math.min((now - began) / length, 1);
        const next = t >= 1 ? value : start + (value - start) * easeOut(t);
        current.current = next;
        setShown(next);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const el = inner.current;
    if (startWhenInView && el && typeof IntersectionObserver !== "undefined") {
      watcher = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        watcher?.disconnect();
        run();
      });
      watcher.observe(el);
    } else {
      run();
    }
    return () => {
      watcher?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [armed, value, duration, startWhenInView]);

  return (
    <span
      {...rest}
      ref={(node) => {
        inner.current = node;
        if (typeof forwarded === "function") forwarded(node);
        else if (forwarded) forwarded.current = node;
      }}
      className={cx("tabular-nums", className)}
    >
      <VisuallyHidden>{format.format(value)}</VisuallyHidden>
      <span aria-hidden="true">{format.format(shown)}</span>
    </span>
  );
});
