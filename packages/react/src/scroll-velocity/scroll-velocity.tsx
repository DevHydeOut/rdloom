"use client";

import { forwardRef, useEffect, useRef, useState, type HTMLAttributes } from "react";
import { Button } from "react-aria-components";
import { scrollVelocityDefaults, type ScrollVelocitySpecProps } from "../generated/scroll-velocity.types";
import { cx } from "../utils/cx";
import { prefersReducedMotion, useIsomorphicLayoutEffect, useReducedMotion } from "../utils/motion";

export interface ScrollVelocityProps
  extends ScrollVelocitySpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof ScrollVelocitySpecProps | "className"> {
  className?: string;
}

/**
 * Rows of text that drift sideways. Their speed follows how fast the page is scrolled, and rows
 * alternate direction. The first copy of each row is real text; the repeats are aria-hidden. It stops
 * with isPaused, from a visible Pause button, inside .rdm-still, and for reduced motion.
 */
export const ScrollVelocity = forwardRef<HTMLDivElement, ScrollVelocityProps>(function ScrollVelocity(
  {
    rows,
    speed = scrollVelocityDefaults.speed,
    velocityFactor = scrollVelocityDefaults.velocityFactor,
    showPauseButton = scrollVelocityDefaults.showPauseButton,
    pauseLabel = scrollVelocityDefaults.pauseLabel,
    playLabel = scrollVelocityDefaults.playLabel,
    isPaused = scrollVelocityDefaults.isPaused,
    className,
    ...rest
  },
  forwarded,
) {
  const root = useRef<HTMLDivElement | null>(null);
  const tracks = useRef<(HTMLSpanElement | null)[]>([]);
  const firstCopies = useRef<(HTMLSpanElement | null)[]>([]);
  const [copies, setCopies] = useState(3);
  const [stopped, setStopped] = useState(false);
  const reduced = useReducedMotion();
  const paused = isPaused || stopped;
  const live = useRef({ paused, speed, velocityFactor });
  live.current = { paused: paused || reduced, speed, velocityFactor };

  // Enough copies to fill the widest row.
  useIsomorphicLayoutEffect(() => {
    const frame = root.current;
    if (!frame || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const widths = firstCopies.current.map((c) => c?.offsetWidth ?? 0).filter(Boolean);
      if (widths.length === 0) return;
      setCopies(Math.min(12, Math.max(2, Math.ceil(frame.offsetWidth / Math.min(...widths)) + 1)));
    };
    measure();
    const watcher = new ResizeObserver(measure);
    watcher.observe(frame);
    firstCopies.current.forEach((c) => c && watcher.observe(c));
    return () => watcher.disconnect();
  }, [rows]);

  useEffect(() => {
    if (typeof requestAnimationFrame === "undefined") return;
    const positions: number[] = [];
    let frame = 0;
    let last = performance.now();
    let lastY = window.scrollY;
    let velocity = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const y = window.scrollY;
      if (dt > 0) velocity += ((y - lastY) / dt - velocity) * Math.min(1, dt * 8);
      lastY = y;
      const { paused: halted, speed: base, velocityFactor: factor } = live.current;
      if (halted || prefersReducedMotion() || root.current?.closest(".rdm-still")) return;
      tracks.current.forEach((track, i) => {
        const width = firstCopies.current[i]?.offsetWidth ?? 0;
        if (!track || !width) return;
        const direction = i % 2 === 0 ? 1 : -1;
        const next = (positions[i] ?? 0) + direction * (base + velocity * factor) * dt;
        positions[i] = ((next % width) + width) % width;
        track.style.transform = `translate3d(${-positions[i]}px, 0, 0)`;
      });
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      {...rest}
      ref={(el) => {
        root.current = el;
        if (typeof forwarded === "function") forwarded(el);
        else if (forwarded) forwarded.current = el;
      }}
      data-rdm-paused={paused || undefined}
      className={cx("rdm-sv", className)}
    >
      {rows.map((row, r) => (
        <p key={r} className="rdm-sv-row">
          <span
            ref={(el) => {
              tracks.current[r] = el;
            }}
            className="rdm-sv-track"
          >
            {Array.from({ length: copies }, (_, i) =>
              i === 0 ? (
                <span
                  key={i}
                  ref={(el) => {
                    firstCopies.current[r] = el;
                  }}
                  className="rdm-sv-copy"
                >
                  {row}
                </span>
              ) : (
                <span key={i} aria-hidden="true" className="rdm-sv-copy rdm-sv-dup">
                  {row}
                </span>
              ),
            )}
          </span>
        </p>
      ))}
      {showPauseButton ? (
        <Button
          onPress={() => setStopped((s) => !s)}
          className="rdm-sv-toggle mt-2 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-3 py-1 text-sm font-normal text-[var(--rd-color-text-default)] outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
        >
          {paused ? playLabel : pauseLabel}
        </Button>
      ) : null}
    </div>
  );
});
