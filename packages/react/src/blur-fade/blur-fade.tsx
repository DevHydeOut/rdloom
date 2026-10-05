"use client";

import { forwardRef, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { blurFadeDefaults, type BlurFadeSpecProps } from "../generated/blur-fade.types";
import { cx } from "../utils/cx";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "../utils/motion";

export interface BlurFadeProps extends BlurFadeSpecProps, Omit<HTMLAttributes<HTMLDivElement>, keyof BlurFadeSpecProps | "className"> {
  className?: string;
}

type Phase = "visible" | "hidden" | "shown";

/**
 * Content that sharpens and slides into place when it first appears, or when it scrolls into view.
 *
 * It is visible to start with, in the server HTML and for anyone without JavaScript. Only once it
 * is running in the browser (and the visitor hasn't asked for less motion) is it hidden before the
 * first paint and brought back, so nothing is ever stuck invisible.
 */
export const BlurFade = forwardRef<HTMLDivElement, BlurFadeProps>(function BlurFade(
  {
    children,
    delay = blurFadeDefaults.delay,
    duration = blurFadeDefaults.duration,
    offset = blurFadeDefaults.offset,
    blur = blurFadeDefaults.blur,
    whenInView = blurFadeDefaults.whenInView,
    className,
    style,
    ...rest
  },
  forwarded,
) {
  const inner = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>("visible");

  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    setPhase("hidden");
  }, []);

  useEffect(() => {
    if (phase !== "hidden") return;
    const el = inner.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reveal = () => {
      timer = setTimeout(() => setPhase("shown"), delay * 1000);
    };
    if (!whenInView || !el || typeof IntersectionObserver === "undefined") {
      reveal();
      return () => clearTimeout(timer);
    }
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        watcher.disconnect();
        reveal();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    watcher.observe(el);
    return () => {
      watcher.disconnect();
      clearTimeout(timer);
    };
  }, [phase, delay, whenInView]);

  const motion: CSSProperties =
    phase === "visible"
      ? {}
      : phase === "hidden"
        ? { opacity: 0, filter: `blur(${blur}px)`, transform: `translateY(${offset}px)` }
        : {
            opacity: 1,
            filter: "blur(0)",
            transform: "none",
            transition: `opacity ${duration}s ease-out, filter ${duration}s ease-out, transform ${duration}s ease-out`,
          };

  return (
    <div
      {...rest}
      ref={(node) => {
        inner.current = node;
        if (typeof forwarded === "function") forwarded(node);
        else if (forwarded) forwarded.current = node;
      }}
      data-blur-fade={phase}
      className={cx(className)}
      style={{ ...motion, ...style }}
    >
      {children}
    </div>
  );
});
