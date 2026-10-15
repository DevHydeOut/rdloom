"use client";

import { useEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "./motion";

// Shared by the canvas motion components (AnimatedBeam, Confetti, Particles). Plain browser code:
// no dependency. The canvas is decoration only, so callers keep it aria-hidden and out of pointer events.

/** True when the effect should not move: paused by the prop, reduced motion, or inside an .rdm-still container. */
export function isStillNow(el: Element | null | undefined, paused?: boolean): boolean {
  return Boolean(paused) || prefersReducedMotion() || Boolean(el?.closest(".rdm-still"));
}

/** A 2d context for the canvas, or null where canvas is missing (jsdom, very old browsers). */
export function getContext2d(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
  if (!canvas || typeof canvas.getContext !== "function") return null;
  try {
    return canvas.getContext("2d") ?? null;
  } catch {
    return null;
  }
}

/** Sizes the backing store to the element's CSS box at the device pixel ratio and returns the CSS size. */
export function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, width: number, height: number) {
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  if (typeof ctx.setTransform === "function") ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width: w, height: h };
}

/** Turns any CSS colour (including var(--token)) into something a canvas can paint with. */
export function resolveColor(host: Element, value: string): string {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function") return value;
  const probe = document.createElement("span");
  probe.style.color = value;
  probe.style.display = "none";
  host.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  host.removeChild(probe);
  return resolved || value;
}

interface LoopOptions {
  /** Called every frame while moving. Return false to end the loop. */
  frame: (deltaMs: number) => boolean | void;
  isStill: () => boolean;
  isHidden?: () => boolean;
  /** Called when the loop notices the effect should be still, so it can draw the resting picture. */
  still?: () => void;
}

/**
 * Runs an animation loop that costs next to nothing while the effect is still or off-screen:
 * it then only checks again a few times a second. Returns a function that cancels everything.
 */
export function runLoop({ frame, isStill, isHidden, still }: LoopOptions): () => void {
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let last = 0;
  let stopped = false;
  let wasStill = false;

  const idle = () => {
    timer = setTimeout(tick, 400);
  };
  const tick = () => {
    if (stopped) return;
    if (isStill()) {
      if (!wasStill) still?.();
      wasStill = true;
      last = 0;
      idle();
      return;
    }
    wasStill = false;
    if (isHidden?.()) {
      last = 0;
      idle();
      return;
    }
    raf = requestAnimationFrame((now) => {
      if (stopped) return;
      if (isStill() || isHidden?.()) {
        last = 0;
        tick();
        return;
      }
      const delta = last ? Math.min(now - last, 64) : 16;
      last = now;
      if (frame(delta) === false) return;
      tick();
    });
  };
  tick();
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    if (timer) clearTimeout(timer);
  };
}

/** Whether the element is on screen. Starts true, so it works without IntersectionObserver. */
export function useInView(ref: RefObject<Element | null>): RefObject<boolean> {
  const inView = useRef(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const watcher = new IntersectionObserver((entries) => {
      for (const entry of entries) inView.current = entry.isIntersecting;
    });
    watcher.observe(el);
    return () => watcher.disconnect();
  }, [ref]);
  return inView;
}
