"use client";

import { forwardRef, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { textAnimateDefaults, type TextAnimateSpecProps } from "../generated/text-animate.types";
import { cx } from "../utils/cx";
import { motionVars, prefersReducedMotion, useIsomorphicLayoutEffect, useReducedMotion } from "../utils/motion";
import { splitLines, splitWords } from "../utils/split-text";

export interface TextAnimateProps
  extends TextAnimateSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof TextAnimateSpecProps | "className" | "children"> {
  className?: string;
}

type Phase = "idle" | "wait" | "run";

/**
 * Text that animates in by character, word or line with a preset. The full text is in the server HTML
 * and is also given to screen readers as visually hidden text; the animated copy is hidden from them.
 * Animation starts after mount; reduced motion and isPaused show the text as it is.
 */
export const TextAnimate = forwardRef<HTMLSpanElement, TextAnimateProps>(function TextAnimate(
  {
    children,
    by = textAnimateDefaults.by,
    animation = textAnimateDefaults.animation,
    delay = textAnimateDefaults.delay,
    duration = textAnimateDefaults.duration,
    stagger = textAnimateDefaults.stagger,
    whenInView = textAnimateDefaults.whenInView,
    isPaused = textAnimateDefaults.isPaused,
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
  }, [still, children, by, animation]);

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

  let n = 0;
  const unit = (content: string) => {
    const i = n++;
    return (
      <span key={i} className="rdm-unit" style={{ "--rdm-i": i } as CSSProperties}>
        {content}
      </span>
    );
  };

  let visual: ReactNode;
  if (by === "line") {
    visual = splitLines(children).map((line, i, all) => (
      <span key={i}>
        {unit(line)}
        {i < all.length - 1 ? <br /> : null}
      </span>
    ));
  } else if (by === "word") {
    visual = splitWords(children).map((word, i, all) => (
      <span key={i}>
        {unit(word)}
        {i < all.length - 1 ? " " : null}
      </span>
    ));
  } else {
    visual = splitWords(children).map((word, i, all) => (
      <span key={i}>
        <span className="rdm-word-nowrap">{Array.from(word).map((ch) => unit(ch))}</span>
        {i < all.length - 1 ? " " : null}
      </span>
    ));
  }

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
      className={cx("rdm-text-animate", `rdm-ta-${animation}`, className)}
      style={{ ...motionVars({ "--rdm-d": `${duration}s`, "--rdm-s": `${stagger}s`, "--rdm-delay": `${delay}s` }), ...style }}
    >
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">{visual}</span>
    </span>
  );
});
