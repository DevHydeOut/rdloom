"use client";

import { Children, forwardRef, useRef, useState, version, type CSSProperties, type HTMLAttributes } from "react";
import { Button } from "react-aria-components";
import { marqueeDefaults, type MarqueeSpecProps } from "../generated/marquee.types";
import { cx } from "../utils/cx";
import { useIsomorphicLayoutEffect } from "../utils/motion";

export interface MarqueeProps
  extends MarqueeSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof MarqueeSpecProps | "className"> {
  className?: string;
}

// React 19 takes inert as a boolean, React 18 only as an attribute string.
const inertProps = (Number(version.split(".")[0]) >= 19 ? { inert: true } : { inert: "" }) as Record<string, unknown>;

/**
 * An endless scrolling row or column. The items are real DOM and the first copy is the only one
 * assistive technology sees: repeats are aria-hidden and inert. It pauses on hover and focus, from
 * isPaused, and from an optional visible Pause button, and it stands still for reduced motion.
 */
export const Marquee = forwardRef<HTMLDivElement, MarqueeProps>(function Marquee(
  {
    children,
    direction = marqueeDefaults.direction,
    reverse = marqueeDefaults.reverse,
    speed = marqueeDefaults.speed,
    gap = marqueeDefaults.gap,
    pauseOnHover = marqueeDefaults.pauseOnHover,
    showPauseButton = marqueeDefaults.showPauseButton,
    pauseLabel = marqueeDefaults.pauseLabel,
    playLabel = marqueeDefaults.playLabel,
    fade = marqueeDefaults.fade,
    isPaused = marqueeDefaults.isPaused,
    className,
    style,
    ...rest
  },
  ref,
) {
  const vertical = direction === "vertical";
  const view = useRef<HTMLDivElement | null>(null);
  const firstCopy = useRef<HTMLDivElement | null>(null);
  const [copies, setCopies] = useState(2);
  const [seconds, setSeconds] = useState<number | undefined>(undefined);
  const [stopped, setStopped] = useState(false);
  const paused = isPaused || stopped;

  // Measure one copy: its length sets the speed, and the viewport decides how many copies fill the row.
  useIsomorphicLayoutEffect(() => {
    const copy = firstCopy.current;
    const frame = view.current;
    if (!copy || !frame || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const one = vertical ? copy.offsetHeight : copy.offsetWidth;
      const room = vertical ? frame.offsetHeight : frame.offsetWidth;
      if (!one) return;
      setSeconds(one / Math.max(speed, 1));
      setCopies(Math.min(12, Math.max(2, Math.ceil(room / one) + 1)));
    };
    measure();
    const watcher = new ResizeObserver(measure);
    watcher.observe(copy);
    watcher.observe(frame);
    return () => watcher.disconnect();
  }, [vertical, speed, gap, children]);

  const vars = {
    "--rdm-g": gap,
    "--rdm-n": copies,
    ...(seconds ? { "--rdm-d": `${seconds}s` } : {}),
  } as CSSProperties;

  const items = Children.toArray(children);

  return (
    <div
      {...rest}
      ref={ref}
      data-rdm-paused={paused || undefined}
      data-pause-hover={pauseOnHover || undefined}
      className={cx("rdm-marquee flex flex-col gap-2", className)}
      style={{ ...style, ...vars }}
    >
      <div ref={view} className="rdm-marquee-view min-h-0 flex-1" data-fade={fade ? direction : undefined}>
        <div className="rdm-marquee-track" data-vertical={vertical || undefined} data-reverse={reverse || undefined}>
          {Array.from({ length: copies }, (_, i) =>
            i === 0 ? (
              <div key={i} ref={firstCopy} className="rdm-marquee-copy" data-vertical={vertical || undefined}>
                {items}
              </div>
            ) : (
              <div
                key={i}
                aria-hidden="true"
                {...inertProps}
                className="rdm-marquee-copy rdm-marquee-dup"
                data-vertical={vertical || undefined}
              >
                {items}
              </div>
            ),
          )}
        </div>
      </div>
      {showPauseButton ? (
        <Button
          onPress={() => setStopped((s) => !s)}
          className="rdm-marquee-toggle self-center rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-3 py-1 text-sm text-[var(--rd-color-text-default)] outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
        >
          {paused ? playLabel : pauseLabel}
        </Button>
      ) : null}
    </div>
  );
});
