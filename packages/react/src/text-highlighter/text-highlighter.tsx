"use client";

import { forwardRef, useEffect, useRef, useState, type HTMLAttributes } from "react";
import { textHighlighterDefaults, type TextHighlighterSpecProps } from "../generated/text-highlighter.types";
import { cx } from "../utils/cx";
import { motionVars, prefersReducedMotion, useIsomorphicLayoutEffect, useReducedMotion } from "../utils/motion";

export interface TextHighlighterProps
  extends TextHighlighterSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof TextHighlighterSpecProps | "className" | "children"> {
  className?: string;
}

type Phase = "idle" | "wait" | "run";

/**
 * A marker highlight behind inline text. The text is not split or copied: the marker is a background that
 * sweeps from the start edge to the end (and wraps with the text). The server HTML already shows the
 * finished highlight; after mount it waits, then sweeps once. Reduced motion and isPaused keep it drawn.
 */
export const TextHighlighter = forwardRef<HTMLSpanElement, TextHighlighterProps>(function TextHighlighter(
  {
    children,
    color,
    whenInView = textHighlighterDefaults.whenInView,
    duration = textHighlighterDefaults.duration,
    delay = textHighlighterDefaults.delay,
    isPaused = textHighlighterDefaults.isPaused,
    className,
    style,
    ...rest
  },
  forwarded,
) {
  const node = useRef<HTMLSpanElement | null>(null);
  const reduced = useReducedMotion();
  const still = isPaused || reduced;
  const [phase, setPhase] = useState<Phase>("idle");

  useIsomorphicLayoutEffect(() => {
    setPhase(still || prefersReducedMotion() ? "idle" : "wait");
  }, [still, children]);

  useEffect(() => {
    if (phase !== "wait") return;
    const el = node.current;
    if (!whenInView || !el || typeof IntersectionObserver === "undefined") {
      setPhase("run");
      return;
    }
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        watcher.disconnect();
        setPhase("run");
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    watcher.observe(el);
    return () => watcher.disconnect();
  }, [phase, whenInView]);

  return (
    <span
      {...rest}
      ref={(el) => {
        node.current = el;
        if (typeof forwarded === "function") forwarded(el);
        else if (forwarded) forwarded.current = el;
      }}
      data-rdm-paused={isPaused || undefined}
      data-rdm-anim={phase}
      className={cx("rdm-hl", className)}
      style={{ ...motionVars({ "--rdm-c": color, "--rdm-d": `${duration}s`, "--rdm-delay": `${delay}s` }), ...style }}
    >
      {children}
    </span>
  );
});
