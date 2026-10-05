"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { Button, type ButtonProps } from "../button/button";
import { rippleButtonDefaults, type RippleButtonSpecProps } from "../generated/ripple-button.types";
import { cx } from "../utils/cx";
import { motionVars } from "../utils/motion";

export interface RippleButtonProps extends RippleButtonSpecProps, Omit<ButtonProps, keyof RippleButtonSpecProps> {}

interface Wave {
  id: number;
  x: number;
  y: number;
  size: number;
}

/** A button that sends a ripple out from where it was pressed (from the centre for a key press). Builds on Button. */
export const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(function RippleButton(
  { children, duration = rippleButtonDefaults.duration, className, style, onPressStart, ...rest },
  forwarded,
) {
  const element = useRef<HTMLButtonElement | null>(null);
  const [waves, setWaves] = useState<Wave[]>([]);
  const next = useRef(0);

  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      element.current = node;
      if (typeof forwarded === "function") forwarded(node);
      else if (forwarded) forwarded.current = node;
    },
    [forwarded],
  );

  const send = (x: number, y: number, width: number, height: number) =>
    // Big enough to reach the farthest corner from where it started.
    setWaves((w) => [...w, { id: next.current++, x, y, size: Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) * 2 }]);

  // Pointer position is not part of a press event, so read it from the pointer itself.
  useEffect(() => {
    const el = element.current;
    if (!el) return;
    const onDown = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      send(e.clientX - box.left, e.clientY - box.top, box.width, box.height);
    };
    el.addEventListener("pointerdown", onDown);
    return () => el.removeEventListener("pointerdown", onDown);
  }, []);

  return (
    <Button
      {...rest}
      ref={setRef}
      className={cx("relative overflow-hidden", className)}
      style={(values) => ({ ...motionVars({ "--rdm-d": `${duration}ms` }), ...(typeof style === "function" ? style(values) : style) })}
      onPressStart={(e) => {
        onPressStart?.(e);
        // A key press has no pointer: ripple from the middle.
        if ((e.pointerType === "keyboard" || e.pointerType === "virtual") && element.current) {
          const { width, height } = element.current.getBoundingClientRect();
          send(width / 2, height / 2, width, height);
        }
      }}
    >
      <span className="relative z-[1] inline-flex items-center gap-2">{children}</span>
      {waves.map((w) => (
        <span
          key={w.id}
          aria-hidden="true"
          className="rdm-ripple"
          style={{ left: w.x, top: w.y, width: w.size, height: w.size }}
          onAnimationEnd={() => setWaves((all) => all.filter((x) => x.id !== w.id))}
        />
      ))}
    </Button>
  );
});
