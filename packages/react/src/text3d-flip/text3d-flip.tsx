"use client";

import { forwardRef, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { text3dFlipDefaults, type Text3dFlipSpecProps } from "../generated/text3d-flip.types";
import { cx } from "../utils/cx";
import { motionVars, prefersReducedMotion, useReducedMotion } from "../utils/motion";
import { splitWords } from "../utils/split-text";

export interface Text3dFlipProps
  extends Text3dFlipSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof Text3dFlipSpecProps | "className" | "children"> {
  className?: string;
}

/**
 * Letters or words that flip in 3D on hover or focus, or once when they scroll into view. The full text
 * is in the server HTML and given to screen readers as visually hidden text; the flipping copy is
 * hidden from them. The element is not focusable by itself: focus inside it (a wrapped link) flips it too.
 */
export const Text3dFlip = forwardRef<HTMLSpanElement, Text3dFlipProps>(function Text3dFlip(
  {
    children,
    by = text3dFlipDefaults.by,
    trigger = text3dFlipDefaults.trigger,
    duration = text3dFlipDefaults.duration,
    stagger = text3dFlipDefaults.stagger,
    isPaused = text3dFlipDefaults.isPaused,
    className,
    style,
    ...rest
  },
  forwarded,
) {
  const node = useRef<HTMLSpanElement | null>(null);
  const reduced = useReducedMotion();
  const still = isPaused || reduced;
  const [ran, setRan] = useState(false);

  useEffect(() => {
    if (trigger !== "view" || still || prefersReducedMotion()) return;
    const el = node.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        watcher.disconnect();
        setRan(true);
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    watcher.observe(el);
    return () => watcher.disconnect();
  }, [trigger, still]);

  let n = 0;
  const unit = (content: string) => {
    const i = n++;
    return (
      <span key={i} className="rdm-flip-unit" style={{ "--rdm-i": i } as CSSProperties}>
        {content}
      </span>
    );
  };
  const words = splitWords(children);

  return (
    <span
      {...rest}
      ref={(el) => {
        node.current = el;
        if (typeof forwarded === "function") forwarded(el);
        else if (forwarded) forwarded.current = el;
      }}
      data-rdm-paused={isPaused || undefined}
      data-rdm-run={ran || undefined}
      data-trigger={trigger}
      className={cx("rdm-flip", className)}
      style={{ ...motionVars({ "--rdm-d": `${duration}s`, "--rdm-s": `${stagger}s` }), ...style }}
    >
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span key={i}>
            {by === "word" ? unit(word) : <span className="rdm-word-nowrap">{Array.from(word).map((ch) => unit(ch))}</span>}
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </span>
  );
});
