"use client";

import { Children, forwardRef, isValidElement, useEffect, useRef, type CSSProperties, type HTMLAttributes, type Key } from "react";
import { animatedListDefaults, type AnimatedListSpecProps } from "../generated/animated-list.types";
import { cx } from "../utils/cx";

export interface AnimatedListProps
  extends AnimatedListSpecProps,
    Omit<HTMLAttributes<HTMLUListElement>, keyof AnimatedListSpecProps | "className"> {
  className?: string;
}

/**
 * A list whose items slide and fade in one after another, and stack as new ones arrive.
 *
 * It is a real ul with one li per child, all present in the server HTML. The movement is a one-shot
 * CSS animation, so nothing is hidden without it, and nothing keeps moving afterwards. Items that
 * were already on screen never replay; a batch added later staggers from its own first item.
 */
export const AnimatedList = forwardRef<HTMLUListElement, AnimatedListProps>(function AnimatedList(
  {
    children,
    delay = animatedListDefaults.delay,
    duration = animatedListDefaults.duration,
    announce = animatedListDefaults.announce,
    isStill = animatedListDefaults.isStill,
    className,
    style,
    ...rest
  },
  ref,
) {
  // The stagger slot each item was given when it first appeared. It is written after commit, so a
  // repeated render (strict mode) hands out the same slots, and later renders keep them.
  const slots = useRef(new Map<Key, number>());
  const items = Children.toArray(children).map((child, index) => ({
    child,
    key: isValidElement(child) && child.key != null ? child.key : `index-${index}`,
  }));
  const pending = new Map<Key, number>();
  for (const { key } of items) if (!slots.current.has(key)) pending.set(key, pending.size);
  useEffect(() => {
    pending.forEach((slot, key) => slots.current.set(key, slot));
  });

  return (
    <ul
      {...rest}
      ref={ref}
      aria-live={announce ? "polite" : undefined}
      aria-relevant={announce ? "additions" : undefined}
      data-rdm-still={isStill || undefined}
      className={cx("rdm-list m-0 flex list-none flex-col gap-2 p-0", className)}
      style={{ "--rdm-d": `${duration}s`, ...style } as CSSProperties}
    >
      {items.map(({ child, key }) => (
        <li
          key={key}
          className="rdm-list-item"
          style={{ "--rdm-delay": `${(slots.current.get(key) ?? pending.get(key) ?? 0) * delay}s` } as CSSProperties}
        >
          {child}
        </li>
      ))}
    </ul>
  );
});
