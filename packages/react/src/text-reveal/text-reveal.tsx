"use client";

import { forwardRef, useCallback, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { textRevealDefaults, type TextRevealSpecProps } from "../generated/text-reveal.types";
import { cx } from "../utils/cx";
import { prefersReducedMotion, useIsomorphicLayoutEffect, useReducedMotion } from "../utils/motion";
import { splitLines, splitWords } from "../utils/split-text";

export interface TextRevealProps
  extends TextRevealSpecProps,
    Omit<HTMLAttributes<HTMLParagraphElement>, keyof TextRevealSpecProps | "className" | "children"> {
  className?: string;
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/**
 * A passage whose words come to full strength by scroll position (mode "scroll") or together when it
 * comes into view (mode "view"). The words are ordinary text in the DOM and in the server HTML; only
 * their opacity changes, after mount. Reduced motion and isPaused show everything at full strength.
 */
export const TextReveal = forwardRef<HTMLParagraphElement, TextRevealProps>(function TextReveal(
  {
    children,
    by = textRevealDefaults.by,
    mode = textRevealDefaults.mode,
    minOpacity = textRevealDefaults.minOpacity,
    isPaused = textRevealDefaults.isPaused,
    className,
    style,
    ...rest
  },
  forwarded,
) {
  const node = useRef<HTMLParagraphElement | null>(null);
  const units = by === "line" ? splitLines(children) : splitWords(children);
  const reduced = useReducedMotion();
  const still = isPaused || reduced;
  // null: show everything (server render, no JavaScript, still). Otherwise 0..1 progress.
  const [progress, setProgress] = useState<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    setProgress(still || prefersReducedMotion() ? null : 0);
  }, [still, mode]);

  const measure = useCallback(() => {
    const el = node.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const next = clamp((vh * 0.9 - rect.top) / (rect.height + vh * 0.4));
    setProgress(Math.round(next * 100) / 100);
  }, []);

  const active = progress !== null;
  useEffect(() => {
    if (!active) return;
    if (mode === "scroll") {
      measure();
      let frame = 0;
      const onScroll = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(measure);
      };
      // Capture, so scrolling inside a nested container counts too.
      document.addEventListener("scroll", onScroll, true);
      window.addEventListener("resize", onScroll);
      return () => {
        cancelAnimationFrame(frame);
        document.removeEventListener("scroll", onScroll, true);
        window.removeEventListener("resize", onScroll);
      };
    }
    const el = node.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setProgress(1);
      return;
    }
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        watcher.disconnect();
        setProgress(1);
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    watcher.observe(el);
    return () => watcher.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, mode, measure]);

  const opacityOf = (i: number): CSSProperties => {
    if (progress === null) return {};
    if (mode === "view") {
      return { opacity: progress >= 1 ? 1 : minOpacity, transition: `opacity 0.5s ease-out ${i * 0.06}s` };
    }
    const local = clamp(progress * units.length - i);
    return { opacity: minOpacity + (1 - minOpacity) * local };
  };

  return (
    <p
      {...rest}
      ref={(el) => {
        node.current = el;
        if (typeof forwarded === "function") forwarded(el);
        else if (forwarded) forwarded.current = el;
      }}
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-text-reveal", className)}
      style={style}
    >
      {units.map((unit, i) => (
        <span key={i} className="rdm-reveal-unit" style={opacityOf(i)}>
          {unit}
          {i < units.length - 1 ? (by === "line" ? <br /> : " ") : null}
        </span>
      ))}
    </p>
  );
});
