"use client";

import { forwardRef, useEffect, useState, type HTMLAttributes } from "react";
import { typingAnimationDefaults, type TypingAnimationSpecProps } from "../generated/typing-animation.types";
import { cx } from "../utils/cx";
import { prefersReducedMotion, useIsomorphicLayoutEffect, useReducedMotion } from "../utils/motion";

export interface TypingAnimationProps
  extends TypingAnimationSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof TypingAnimationSpecProps | "className" | "children"> {
  className?: string;
}

const HOLD_BEFORE_LOOP = 1600;

/**
 * Text that types itself out. The full text is in the server HTML and is always available to screen
 * readers as visually hidden text; only the visible copy is typed, after mount. Reduced motion and
 * isPaused show the finished text.
 */
export const TypingAnimation = forwardRef<HTMLSpanElement, TypingAnimationProps>(function TypingAnimation(
  {
    children,
    speed = typingAnimationDefaults.speed,
    delay = typingAnimationDefaults.delay,
    cursor = typingAnimationDefaults.cursor,
    loop = typingAnimationDefaults.loop,
    isPaused = typingAnimationDefaults.isPaused,
    className,
    style,
    ...rest
  },
  ref,
) {
  const chars = Array.from(children);
  const total = chars.length;
  const reduced = useReducedMotion();
  const still = isPaused || reduced;
  // null means "show everything": the server render, no JavaScript, reduced motion and isPaused.
  const [count, setCount] = useState<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    setCount(still || prefersReducedMotion() ? null : 0);
  }, [still, children]);

  useEffect(() => {
    if (count === null) return;
    let timer: ReturnType<typeof setTimeout>;
    if (count < total) {
      timer = setTimeout(() => setCount(count + 1), count === 0 ? delay * 1000 + speed : speed);
    } else if (loop) {
      timer = setTimeout(() => setCount(0), HOLD_BEFORE_LOOP);
    }
    return () => clearTimeout(timer);
  }, [count, total, speed, delay, loop]);

  const shown = count === null ? children : chars.slice(0, count).join("");
  return (
    <span
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-typing", className)}
      style={style}
    >
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {shown}
        {cursor && <span className="rdm-caret" />}
      </span>
    </span>
  );
});
