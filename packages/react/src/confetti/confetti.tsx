"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type HTMLAttributes } from "react";
import { confettiDefaults, type ConfettiSpecProps } from "../generated/confetti.types";
import { cx } from "../utils/cx";
import { fitCanvas, getContext2d, isStillNow, resolveColor, runLoop } from "../utils/canvas-effects";

export interface ConfettiHandle {
  /** Launches a burst. Does nothing for reduced motion, inside rdm-still, or when isPaused. */
  fire: (options?: { particleCount?: number; spread?: number; origin?: { x: number; y: number } }) => void;
}

export interface ConfettiProps
  extends ConfettiSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof ConfettiSpecProps | "className"> {
  className?: string;
}

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  w: number;
  h: number;
  color: string;
  age: number;
  life: number;
}

const DEFAULT_COLORS = [
  "var(--rd-color-action-primary)",
  "var(--rd-color-feedback-success)",
  "var(--rd-color-feedback-warning)",
  "var(--rd-color-feedback-danger)",
  "var(--rd-color-feedback-info)",
];
const GRAVITY = 900; // pixels per second squared
const MAX_LIFE = 3; // seconds: a burst never lasts longer than this

/**
 * A burst of paper pieces. Call `fire()` on the ref or turn `isActive` on. The canvas exists only while
 * pieces are falling, then removes itself. It is aria-hidden and ignores the pointer, and draws nothing at
 * all for reduced motion, inside rdm-still or with isPaused.
 */
export const Confetti = forwardRef<ConfettiHandle, ConfettiProps>(function Confetti(
  {
    isActive = confettiDefaults.isActive,
    particleCount = confettiDefaults.particleCount,
    spread = confettiDefaults.spread,
    origin,
    colors,
    onComplete,
    isPaused = confettiDefaults.isPaused,
    className,
    ...rest
  },
  ref,
) {
  const anchor = useRef<HTMLSpanElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const pieces = useRef<Piece[]>([]);
  const [running, setRunning] = useState(false);
  const latest = useRef({ particleCount, spread, origin, colors, onComplete, isPaused });
  latest.current = { particleCount, spread, origin, colors, onComplete, isPaused };

  const fire = useCallback<ConfettiHandle["fire"]>((options = {}) => {
    const now = latest.current;
    if (isStillNow(anchor.current, now.isPaused)) return;
    const count = Math.max(0, Math.min(Math.round(options.particleCount ?? now.particleCount), 300));
    const cone = ((options.spread ?? now.spread) * Math.PI) / 180;
    const from = options.origin ?? now.origin ?? { x: 0.5, y: 0.6 };
    const w = window.innerWidth;
    const h = window.innerHeight;
    const palette = (now.colors?.length ? now.colors : DEFAULT_COLORS).map((c) => resolveColor(anchor.current ?? document.body, c));
    for (let i = 0; i < count; i++) {
      const direction = -Math.PI / 2 + (Math.random() - 0.5) * cone;
      const speed = 350 + Math.random() * 550;
      pieces.current.push({
        x: from.x * w,
        y: from.y * h,
        vx: Math.cos(direction) * speed,
        vy: Math.sin(direction) * speed,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 12,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        color: palette[i % palette.length],
        age: 0,
        life: MAX_LIFE * (0.7 + Math.random() * 0.3),
      });
    }
    if (count > 0) setRunning(true);
  }, []);

  useImperativeHandle(ref, () => ({ fire }), [fire]);

  // isActive: a burst each time it turns true.
  const wasActive = useRef(false);
  useEffect(() => {
    if (isActive && !wasActive.current) fire();
    wasActive.current = isActive;
  }, [isActive, fire]);

  // The loop runs only while the canvas is on the page, and ends when the last piece has gone.
  useEffect(() => {
    if (!running) return;
    const el = canvas.current;
    const ctx = getContext2d(el);
    const finish = () => {
      pieces.current = [];
      setRunning(false);
      latest.current.onComplete?.();
    };
    if (!el || !ctx) {
      finish();
      return;
    }
    const stop = runLoop({
      isStill: () => isStillNow(anchor.current, latest.current.isPaused),
      still: finish,
      frame: (delta) => {
        const dt = delta / 1000;
        const size = fitCanvas(el, ctx, window.innerWidth, window.innerHeight);
        ctx.clearRect(0, 0, size.width, size.height);
        const alive: Piece[] = [];
        for (const p of pieces.current) {
          p.age += dt;
          if (p.age >= p.life || p.y > size.height + 20) continue;
          p.vx *= 1 - 1.6 * dt;
          p.vy = p.vy * (1 - 1.2 * dt) + GRAVITY * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.angle += p.spin * dt;
          ctx.save();
          ctx.globalAlpha = Math.min(1, (p.life - p.age) / 0.6);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
          alive.push(p);
        }
        pieces.current = alive;
        if (!alive.length) {
          finish();
          return false;
        }
      },
    });
    return stop;
  }, [running]);

  return (
    <span {...rest} ref={anchor} aria-hidden="true" data-rdm-paused={isPaused || undefined} className={cx("rdm-confetti", className)}>
      {running ? <canvas ref={canvas} aria-hidden="true" className="rdm-confetti-canvas" /> : null}
    </span>
  );
});
