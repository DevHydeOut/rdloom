"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from "react";
import {
  interactiveGridPatternDefaults,
  type InteractiveGridPatternSpecProps,
} from "../generated/interactive-grid-pattern.types";
import { cx } from "../utils/cx";
import { useReducedMotion } from "../utils/motion";
import type { PatternDivProps } from "../utils/pattern";

export interface InteractiveGridPatternProps
  extends InteractiveGridPatternSpecProps,
    Omit<PatternDivProps, keyof InteractiveGridPatternSpecProps> {}

interface Cell {
  id: number;
  col: number;
  row: number;
}

const TRAIL = 8;

/**
 * A grid whose cells light up under the mouse or pen. It is decoration: hidden from assistive technology,
 * it never takes the pointer or focus, it does nothing on touch, and it stays dark for reduced motion
 * and isStill. The pointer is read from the parent element, so the content on top keeps working.
 */
export const InteractiveGridPattern = forwardRef<HTMLDivElement, InteractiveGridPatternProps>(function InteractiveGridPattern(
  {
    size = interactiveGridPatternDefaults.size,
    strokeWidth = interactiveGridPatternDefaults.strokeWidth,
    color = interactiveGridPatternDefaults.color,
    activeColor = interactiveGridPatternDefaults.activeColor,
    variant = interactiveGridPatternDefaults.variant,
    fade = interactiveGridPatternDefaults.fade,
    isStill = interactiveGridPatternDefaults.isStill,
    className,
    style,
    ...rest
  },
  forwarded,
) {
  const node = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(forwarded, () => node.current as HTMLDivElement);
  const reduced = useReducedMotion();
  const off = isStill || reduced;
  const [cells, setCells] = useState<Cell[]>([]);
  const last = useRef("");
  const counter = useRef(0);

  const leave = useCallback(() => {
    last.current = "";
    if (variant === "fill") setCells([]);
  }, [variant]);

  useEffect(() => {
    const el = node.current;
    const parent = el?.parentElement;
    if (!el || !parent || off) {
      setCells([]);
      return;
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      const col = Math.floor(x / size);
      const row = Math.floor(y / size);
      const key = `${col}:${row}`;
      if (key === last.current) return;
      last.current = key;
      const cell = { id: ++counter.current, col, row };
      setCells((c) => (variant === "fill" ? [cell] : [...c, cell].slice(-TRAIL)));
    };
    parent.addEventListener("pointermove", move);
    parent.addEventListener("pointerleave", leave);
    return () => {
      parent.removeEventListener("pointermove", move);
      parent.removeEventListener("pointerleave", leave);
    };
  }, [off, size, variant, leave]);

  const line = (dir: string) => `linear-gradient(${dir}, var(--rdm-pc) ${strokeWidth}px, transparent ${strokeWidth}px)`;
  const vars = { "--rdm-pc": color, "--rdm-ac": activeColor } as CSSProperties;

  return (
    <div
      {...rest}
      ref={node}
      aria-hidden="true"
      data-fade={fade ? "edge" : undefined}
      data-variant={variant}
      data-rdm-still={isStill || undefined}
      className={cx("rdm-pattern rdm-igrid", className)}
      style={{ ...style, ...vars }}
    >
      <div
        className="rdm-igrid-lines"
        style={{ backgroundImage: `${line("to right")}, ${line("to bottom")}`, backgroundSize: `${size}px ${size}px` }}
      />
      {cells.map((cell) => (
        <span
          key={cell.id}
          className="rdm-igrid-cell"
          data-cell={variant}
          style={{ insetInlineStart: cell.col * size, top: cell.row * size, width: size, height: size }}
          onAnimationEnd={variant === "trail" ? () => setCells((c) => c.filter((x) => x.id !== cell.id)) : undefined}
        />
      ))}
    </div>
  );
});
