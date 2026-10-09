"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, type CanvasHTMLAttributes } from "react";
import { flickeringGridDefaults, type FlickeringGridSpecProps } from "../generated/flickering-grid.types";
import { cx } from "../utils/cx";
import { useReducedMotion } from "../utils/motion";

export interface FlickeringGridProps
  extends FlickeringGridSpecProps,
    Omit<CanvasHTMLAttributes<HTMLCanvasElement>, "className" | "color" | "children" | keyof FlickeringGridSpecProps> {
  className?: string;
}

/** Every square may pick a new brightness at most this often (ms): 400 is 2.5 changes a second, under the 3 a second limit. */
const TICK = 400;
/** Share of squares that pick a new brightness on a tick. */
const CHANCE = 0.2;
/** Seconds a square takes to move most of the way to its new brightness: slow, so it reads as a fade. */
const EASE = 0.5;

/**
 * A grid of small squares that gently fade in and out, drawn on a canvas that fills its parent.
 * Decoration: hidden from assistive technology, ignores the pointer. It draws one still frame for reduced
 * motion and isStill, and pauses while off screen.
 */
export const FlickeringGrid = forwardRef<HTMLCanvasElement, FlickeringGridProps>(function FlickeringGrid(
  {
    squareSize = flickeringGridDefaults.squareSize,
    gridGap = flickeringGridDefaults.gridGap,
    color = flickeringGridDefaults.color,
    maxOpacity = flickeringGridDefaults.maxOpacity,
    isStill = flickeringGridDefaults.isStill,
    className,
    style,
    ...rest
  },
  forwarded,
) {
  const node = useRef<HTMLCanvasElement | null>(null);
  useImperativeHandle(forwarded, () => node.current as HTMLCanvasElement);
  const reduced = useReducedMotion();
  const still = isStill || reduced;

  useEffect(() => {
    const canvas = node.current;
    const ctx = canvas?.getContext?.("2d");
    if (!canvas || !ctx) return;

    let cols = 0;
    let rows = 0;
    let dpr = 1;
    let current = new Float32Array(0);
    let target = new Float32Array(0);
    let frame = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    let visible = true;
    let last = 0;
    let dirty = true;
    const pitch = squareSize + gridGap;

    const randomLevel = () => Math.random() * maxOpacity;
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      cols = Math.ceil(w / pitch);
      rows = Math.ceil(h / pitch);
      current = new Float32Array(cols * rows);
      target = new Float32Array(cols * rows);
      for (let i = 0; i < current.length; i++) current[i] = target[i] = randomLevel();
      dirty = true;
      draw();
    };
    const draw = () => {
      if (!dirty) return;
      dirty = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // The colour may be a token: let the browser resolve it.
      ctx.fillStyle = getComputedStyle(canvas).color || "#888";
      const s = squareSize * dpr;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          ctx.globalAlpha = current[c * rows + r];
          ctx.fillRect(c * pitch * dpr, r * pitch * dpr, s, s);
        }
      }
      ctx.globalAlpha = 1;
    };
    const tick = () => {
      if (!visible) return;
      for (let i = 0; i < target.length; i++) if (Math.random() < CHANCE) target[i] = randomLevel();
    };
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (!visible) {
        last = now;
        return;
      }
      const k = 1 - Math.exp(-(Math.min(now - last, 100) / 1000) / EASE);
      last = now;
      for (let i = 0; i < current.length; i++) {
        const d = target[i] - current[i];
        if (Math.abs(d) > 0.001) {
          current[i] += d * k;
          dirty = true;
        }
      }
      draw();
    };

    resize();
    const resizer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    resizer?.observe(canvas);
    const watcher =
      typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => (visible = entry?.isIntersecting ?? true));
    watcher?.observe(canvas);
    if (!still) {
      last = performance.now();
      frame = requestAnimationFrame(loop);
      timer = setInterval(tick, TICK);
    }
    return () => {
      cancelAnimationFrame(frame);
      if (timer) clearInterval(timer);
      resizer?.disconnect();
      watcher?.disconnect();
    };
  }, [squareSize, gridGap, maxOpacity, still, color]);

  return (
    <canvas
      {...rest}
      ref={node}
      aria-hidden="true"
      data-rdm-still={still || undefined}
      className={cx("rdm-pattern", className)}
      style={{ ...style, color, width: "100%", height: "100%" }}
    />
  );
});
