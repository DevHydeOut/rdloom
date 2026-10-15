"use client";

import { forwardRef, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type PointerEvent } from "react";
import { smoothCursorDefaults, type SmoothCursorSpecProps } from "../generated/smooth-cursor.types";
import { cx } from "../utils/cx";
import { prefersReducedMotion, useReducedMotion } from "../utils/motion";

export interface SmoothCursorProps
  extends SmoothCursorSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof SmoothCursorSpecProps | "className"> {
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

/**
 * A soft dot or ring that trails the real pointer. It is decoration for mouse users: aria-hidden,
 * pointer-events none, never focusable, and it does not exist for touch or pen input, reduced motion,
 * isStill or an enclosing rdm-still. The frame loop runs only while it is catching up.
 */
export const SmoothCursor = forwardRef<HTMLDivElement, SmoothCursorProps>(function SmoothCursor(
  {
    children,
    scope = smoothCursorDefaults.scope,
    shape = smoothCursorDefaults.shape,
    size = smoothCursorDefaults.size,
    color,
    smoothing = smoothCursorDefaults.smoothing,
    hideNativeCursor = smoothCursorDefaults.hideNativeCursor,
    isStill = smoothCursorDefaults.isStill,
    className,
    onPointerMove,
    onPointerLeave,
    ...rest
  },
  forwarded,
) {
  const root = useRef<HTMLDivElement | null>(null);
  const follower = useRef<HTMLSpanElement | null>(null);
  const target = useRef<Point>({ x: 0, y: 0 });
  const current = useRef<Point>({ x: 0, y: 0 });
  const seen = useRef(false);
  const frame = useRef(0);
  const last = useRef(0);
  const [mouse, setMouse] = useState(false);
  const [inside, setInside] = useState(false);
  const reduced = useReducedMotion();
  const off = isStill || reduced;
  const page = scope === "page";
  const ease = Math.min(1, Math.max(0.02, smoothing));

  const place = () => {
    const el = follower.current;
    if (el) el.style.transform = `translate3d(${current.current.x - size / 2}px, ${current.current.y - size / 2}px, 0)`;
  };

  const tick = (now: number) => {
    frame.current = 0;
    const dt = Math.min(64, now - (last.current || now - 16.7));
    last.current = now;
    // Frame-rate independent easing: the same feel at 60 and 144 Hz.
    const k = 1 - Math.pow(1 - ease, dt / 16.7);
    const dx = target.current.x - current.current.x;
    const dy = target.current.y - current.current.y;
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
      current.current = { ...target.current };
      place();
      last.current = 0;
      return;
    }
    current.current = { x: current.current.x + dx * k, y: current.current.y + dy * k };
    place();
    frame.current = requestAnimationFrame(tick);
  };

  const aim = (clientX: number, clientY: number, pointerType: string) => {
    if (off || pointerType === "touch" || pointerType === "pen" || prefersReducedMotion() || root.current?.closest(".rdm-still")) {
      setMouse(false);
      return;
    }
    let x = clientX;
    let y = clientY;
    if (!page && root.current) {
      const box = root.current.getBoundingClientRect();
      x -= box.left;
      y -= box.top;
    }
    target.current = { x, y };
    if (!seen.current) {
      // First sight of the mouse: appear in place rather than flying in from the corner.
      seen.current = true;
      current.current = { x, y };
      place();
    }
    setMouse(true);
    setInside(true);
    if (!frame.current) frame.current = requestAnimationFrame(tick);
  };

  // Page scope listens on the document; container scope uses the wrapper's own handlers.
  useEffect(() => {
    if (!page || off) return;
    const move = (e: globalThis.PointerEvent) => aim(e.clientX, e.clientY, e.pointerType);
    const leave = () => setInside(false);
    document.addEventListener("pointermove", move);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      document.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
    // aim reads refs and the props below, so re-subscribe when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, off, size, ease]);

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    },
    [],
  );

  // Hide the system pointer only when asked, and only once a mouse has really been seen.
  const hide = hideNativeCursor && mouse && !off;
  useEffect(() => {
    if (!hide) return;
    const el = page ? document.documentElement : root.current;
    if (!el) return;
    const before = el.style.cursor;
    el.style.cursor = "none";
    return () => {
      el.style.cursor = before;
    };
  }, [hide, page]);

  const visible = mouse && inside && !off;
  const tint = color ?? "var(--rd-color-action-primary)";
  const followerStyle: CSSProperties = {
    position: page ? "fixed" : "absolute",
    top: 0,
    insetInlineStart: 0,
    width: size,
    height: size,
    boxSizing: "border-box",
    borderRadius: "9999px",
    pointerEvents: "none",
    zIndex: 50,
    opacity: visible ? 1 : 0,
    transition: "opacity 150ms",
    willChange: "transform",
    forcedColorAdjust: "none",
    ...(shape === "ring"
      ? { border: "2px solid " + tint, background: "transparent" }
      : { border: "1px solid transparent", background: tint, opacity: visible ? 0.55 : 0 }),
  };
  const dot = off ? null : <span ref={follower} aria-hidden="true" data-rdm-cursor="" style={followerStyle} />;

  if (page) {
    return (
      <>
        {children}
        {dot}
      </>
    );
  }
  return (
    <div
      {...rest}
      ref={(node) => {
        root.current = node;
        if (typeof forwarded === "function") forwarded(node);
        else if (forwarded) forwarded.current = node;
      }}
      onPointerMove={(e: PointerEvent<HTMLDivElement>) => {
        onPointerMove?.(e);
        aim(e.clientX, e.clientY, e.pointerType);
      }}
      onPointerLeave={(e: PointerEvent<HTMLDivElement>) => {
        onPointerLeave?.(e);
        setInside(false);
      }}
      className={cx("relative overflow-hidden", className)}
    >
      {children}
      {dot}
    </div>
  );
});
