"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, type CanvasHTMLAttributes } from "react";
import { particlesDefaults, type ParticlesSpecProps } from "../generated/particles.types";
import { cx } from "../utils/cx";
import { fitCanvas, getContext2d, isStillNow, resolveColor, runLoop, useInView } from "../utils/canvas-effects";

export interface ParticlesProps
  extends ParticlesSpecProps,
    Omit<CanvasHTMLAttributes<HTMLCanvasElement>, keyof ParticlesSpecProps | "className" | "width" | "height"> {
  className?: string;
}

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
}

const MAX = 400;
const REACH = 140; // pixels within which the pointer pulls a dot

/**
 * Small dots that drift and lean toward the pointer, drawn on a canvas that fills its container (give the
 * container position: relative). Paused while off-screen, a still scatter for reduced motion, rdm-still and
 * isPaused, and the animation frame is cancelled on unmount. The pointer is read from the container, so the
 * canvas itself never takes pointer events.
 */
export const Particles = forwardRef<HTMLCanvasElement, ParticlesProps>(function Particles(
  { quantity = particlesDefaults.quantity, size = particlesDefaults.size, color, isPaused = particlesDefaults.isPaused, className, style, ...rest },
  ref,
) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  useImperativeHandle(ref, () => canvas.current as HTMLCanvasElement);
  const inView = useInView(canvas);

  useEffect(() => {
    const el = canvas.current;
    const host = el?.parentElement;
    const ctx = getContext2d(el);
    if (!el || !host || !ctx) return;

    const tint = resolveColor(host, color ?? "var(--rd-color-text-muted)");
    const count = Math.max(0, Math.min(Math.round(quantity), MAX));
    const dots: Dot[] = [];
    let width = 0;
    let height = 0;
    const pointer = { x: -9999, y: -9999 };

    const measure = () => {
      const box = el.getBoundingClientRect();
      const next = fitCanvas(el, ctx, box.width, box.height);
      width = next.width;
      height = next.height;
      if (!dots.length) {
        for (let i = 0; i < count; i++) {
          dots.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 18,
            vy: (Math.random() - 0.5) * 18,
            r: size * (0.6 + Math.random() * 0.8),
            a: 0.3 + Math.random() * 0.5,
          });
        }
      }
    };

    const paint = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = tint;
      for (const d of dots) {
        ctx.globalAlpha = d.a;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const box = el.getBoundingClientRect();
      pointer.x = e.clientX - box.left;
      pointer.y = e.clientY - box.top;
    };
    const onLeave = () => {
      pointer.x = pointer.y = -9999;
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    measure();
    paint();
    const watcher = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
      measure();
      paint();
    });
    watcher?.observe(host);

    const stop = runLoop({
      isStill: () => isStillNow(el, isPaused),
      isHidden: () => inView.current === false,
      still: paint,
      frame: (delta) => {
        const dt = delta / 1000;
        for (const d of dots) {
          const dx = pointer.x - d.x;
          const dy = pointer.y - d.y;
          const dist = Math.hypot(dx, dy);
          if (dist < REACH && dist > 1) {
            // A gentle lean toward the pointer, strongest at the edge of its reach.
            const pull = (1 - dist / REACH) * 40;
            d.vx += (dx / dist) * pull * dt;
            d.vy += (dy / dist) * pull * dt;
          }
          d.vx *= 1 - 0.8 * dt;
          d.vy *= 1 - 0.8 * dt;
          // Keep a slow drift so the dots never freeze.
          d.vx += (Math.random() - 0.5) * 6 * dt;
          d.vy += (Math.random() - 0.5) * 6 * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          if (d.x < -2) d.x = width + 2;
          else if (d.x > width + 2) d.x = -2;
          if (d.y < -2) d.y = height + 2;
          else if (d.y > height + 2) d.y = -2;
        }
        paint();
      },
    });

    return () => {
      stop();
      watcher?.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [quantity, size, color, isPaused, inView]);

  return (
    <canvas
      {...rest}
      ref={canvas}
      aria-hidden="true"
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-particles", className)}
      style={style}
    />
  );
});
