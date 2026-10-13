"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, type CanvasHTMLAttributes } from "react";
import { animatedBeamDefaults, type AnimatedBeamSpecProps } from "../generated/animated-beam.types";
import { cx } from "../utils/cx";
import { fitCanvas, getContext2d, isStillNow, resolveColor, runLoop, useInView } from "../utils/canvas-effects";

export interface AnimatedBeamProps
  extends AnimatedBeamSpecProps,
    Omit<CanvasHTMLAttributes<HTMLCanvasElement>, keyof AnimatedBeamSpecProps | "className" | "width" | "height"> {
  className?: string;
}

type Point = { x: number; y: number };

const SAMPLES = 48;
const TAIL = 0.28;

/** The point at t on a quadratic curve from a to b, bowed by `bow` pixels at its middle. */
function curve(a: Point, b: Point, bow: number, t: number): Point {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // The control point sits twice the bow away, so the curve itself peaks at `bow`.
  const qx = mx + (-dy / len) * bow * 2;
  const qy = my + (dx / len) * bow * 2;
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * qx + t * t * b.x, y: u * u * a.y + 2 * u * t * qy + t * t * b.y };
}

/**
 * A light travelling along a curved line between two elements. It is a canvas that fills the container
 * (give the container position: relative), drawn from the measured positions of the two endpoints, so no
 * markup is added to the accessibility tree. The resting line stays when the light is still.
 */
export const AnimatedBeam = forwardRef<HTMLCanvasElement, AnimatedBeamProps>(function AnimatedBeam(
  {
    containerRef,
    fromRef,
    toRef,
    fromId,
    toId,
    curvature = animatedBeamDefaults.curvature,
    reverse = animatedBeamDefaults.reverse,
    duration = animatedBeamDefaults.duration,
    pathColor,
    beamColor,
    pathWidth = animatedBeamDefaults.pathWidth,
    isPaused = animatedBeamDefaults.isPaused,
    className,
    style,
    ...rest
  },
  ref,
) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  useImperativeHandle(ref, () => canvas.current as HTMLCanvasElement);
  const inView = useInView(canvas);

  useEffect(() => {
    const el = canvas.current;
    const container = containerRef.current;
    const ctx = getContext2d(el);
    if (!el || !container || !ctx) return;

    const endpoint = (r?: typeof fromRef, id?: string) => r?.current ?? (id ? document.getElementById(id) : null);
    const line = resolveColor(container, pathColor ?? "var(--rd-color-border-default)");
    const light = resolveColor(container, beamColor ?? "var(--rd-color-action-primary)");
    let progress = 0;

    const ends = (): [Point, Point] | null => {
      const from = endpoint(fromRef, fromId);
      const to = endpoint(toRef, toId);
      if (!from || !to) return null;
      const box = container.getBoundingClientRect();
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      return [
        { x: a.left + a.width / 2 - box.left, y: a.top + a.height / 2 - box.top },
        { x: b.left + b.width / 2 - box.left, y: b.top + b.height / 2 - box.top },
      ];
    };

    const draw = (moving: boolean) => {
      const box = container.getBoundingClientRect();
      const size = fitCanvas(el, ctx, box.width, box.height);
      ctx.clearRect(0, 0, size.width, size.height);
      const pair = ends();
      if (!pair) return;
      const [a, b] = pair;
      const points = Array.from({ length: SAMPLES + 1 }, (_, i) => curve(a, b, curvature, i / SAMPLES));
      ctx.lineCap = "round";
      ctx.lineWidth = pathWidth;
      ctx.strokeStyle = line;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      if (!moving) return;
      // The light: short segments along the curve, brightest at the head.
      const head = progress * (1 + TAIL);
      ctx.strokeStyle = light;
      for (let i = 0; i < SAMPLES; i++) {
        const t = (i + 0.5) / SAMPLES;
        const pos = reverse ? 1 - t : t;
        const d = head - pos;
        if (d < 0 || d > TAIL) continue;
        ctx.globalAlpha = 1 - d / TAIL;
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const stop = runLoop({
      isStill: () => isStillNow(el, isPaused),
      isHidden: () => inView.current === false,
      still: () => draw(false),
      frame: (delta) => {
        progress = (progress + delta / 1000 / Math.max(duration, 0.2)) % 1;
        draw(true);
      },
    });

    draw(false);
    const watcher = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => draw(false));
    watcher?.observe(container);
    return () => {
      stop();
      watcher?.disconnect();
    };
  }, [containerRef, fromRef, toRef, fromId, toId, curvature, reverse, duration, pathColor, beamColor, pathWidth, isPaused, inView]);

  return (
    <canvas
      {...rest}
      ref={canvas}
      aria-hidden="true"
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-beam", className)}
      style={style}
    />
  );
});
