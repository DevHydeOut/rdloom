"use client";

import { forwardRef, useEffect, useRef, type HTMLAttributes } from "react";
import { VisuallyHidden } from "react-aria-components";
import { globeDefaults, type GlobeSpecProps } from "../generated/globe.types";
import { cx } from "../utils/cx";
import { fitCanvas, getContext2d, isStillNow, resolveColor, runLoop, useInView } from "../utils/canvas-effects";
import { landSpherePoints, unitVector } from "../utils/world-dots";

export interface GlobeProps extends GlobeSpecProps, Omit<HTMLAttributes<HTMLDivElement>, keyof GlobeSpecProps | "className"> {
  className?: string;
}

const TILT = 0.35; // radians the north pole leans toward the viewer
const TURN_PER_SECOND = (Math.PI * 2) / 60;

/**
 * A globe of land dots in orthographic projection. It turns slowly, can be dragged with a pointer, and marks
 * places with glowing dots. The canvas is decoration (aria-hidden); the label, description and the markers as a
 * real list are visually hidden text. Paused while off-screen, one still frame for reduced motion, rdm-still and
 * isPaused, and the frame loop is cancelled on unmount.
 */
export const Globe = forwardRef<HTMLDivElement, GlobeProps>(function Globe(
  {
    label = globeDefaults.label,
    description,
    markers,
    speed = globeDefaults.speed,
    dotColor,
    markerColor,
    isPaused = globeDefaults.isPaused,
    className,
    ...rest
  },
  ref,
) {
  const root = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const inView = useInView(root);

  useEffect(() => {
    const host = root.current;
    const el = canvas.current;
    const ctx = getContext2d(el);
    if (!host || !el || !ctx) return;

    const land = resolveColor(host, dotColor ?? "var(--rd-color-text-muted)");
    const accent = resolveColor(host, markerColor ?? "var(--rd-color-action-primary)");
    const points = landSpherePoints(4);
    const pins = (markers ?? []).map((m) => unitVector(m.lat, m.lng));
    let width = 0;
    let height = 0;
    // Start facing the first marker, or Europe and Africa.
    let rotation = markers?.length ? (markers[0]!.lng * Math.PI) / 180 : 0.35;
    let dragging = false;
    let lastX = 0;
    let pulse = 0;
    const sinT = Math.sin(TILT);
    const cosT = Math.cos(TILT);

    // Turning the globe by `rotation` brings longitude `rotation` to the front.
    const project = (x: number, y: number, z: number, cos: number, sin: number) => {
      const rx = x * cos - z * sin;
      const rz = x * sin + z * cos;
      return { x: rx, y: y * cosT - rz * sinT, z: y * sinT + rz * cosT };
    };

    const paint = () => {
      ctx.clearRect(0, 0, width, height);
      // Before the container has a size (first frame, or hidden) there is nothing to draw, and a negative radius would throw.
      if (width < 8 || height < 8) return;
      const radius = Math.min(width, height) / 2 - 2;
      const cx0 = width / 2;
      const cy0 = height / 2;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = land;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx0, cy0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = land;
      const dot = Math.max(0.8, radius / 120);
      for (let i = 0; i < points.length; i += 3) {
        const p = project(points[i]!, points[i + 1]!, points[i + 2]!, cos, sin);
        if (p.z <= 0) continue;
        ctx.globalAlpha = 0.25 + 0.65 * p.z;
        ctx.beginPath();
        ctx.arc(cx0 + p.x * radius, cy0 - p.y * radius, dot, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const pin of pins) {
        const p = project(pin[0], pin[1], pin[2], cos, sin);
        if (p.z <= 0.05) continue;
        const px = cx0 + p.x * radius;
        const py = cy0 - p.y * radius;
        const glow = dot * 7 * (1 + 0.25 * Math.sin(pulse));
        const gradient = typeof ctx.createRadialGradient === "function" ? ctx.createRadialGradient(px, py, 0, px, py, glow) : null;
        if (gradient) {
          gradient.addColorStop(0, accent);
          gradient.addColorStop(1, "transparent");
          ctx.globalAlpha = 0.45 * p.z;
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(px, py, glow, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = accent;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(px, py, dot * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const measure = () => {
      const box = host.getBoundingClientRect();
      const next = fitCanvas(el, ctx, box.width, box.height);
      width = next.width;
      height = next.height;
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      lastX = e.clientX;
      try {
        host.setPointerCapture?.(e.pointerId);
      } catch {
        // Capture can fail for synthetic events; dragging still works while the pointer stays over the globe.
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const radius = Math.max(1, Math.min(width, height) / 2);
      rotation -= (e.clientX - lastX) / radius;
      lastX = e.clientX;
      paint();
    };
    const onUp = () => {
      dragging = false;
    };
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointercancel", onUp);

    measure();
    paint();
    const watcher =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            measure();
            paint();
          });
    watcher?.observe(host);

    const stop = runLoop({
      isStill: () => isStillNow(host, isPaused),
      isHidden: () => inView.current === false,
      still: paint,
      frame: (delta) => {
        const dt = delta / 1000;
        pulse += dt * 2;
        if (!dragging) rotation -= dt * TURN_PER_SECOND * speed;
        paint();
      },
    });

    return () => {
      stop();
      watcher?.disconnect();
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
    };
  }, [markers, speed, dotColor, markerColor, isPaused, inView]);

  return (
    <div
      {...rest}
      ref={(node) => {
        root.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      role="group"
      aria-label={label}
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-globe", className)}
    >
      <canvas ref={canvas} aria-hidden="true" className="rdm-globe-canvas" />
      <VisuallyHidden elementType="div">
        {description ? <p>{description}</p> : null}
        {markers?.length ? (
          <ul>
            {markers.map((m, i) => (
              <li key={`${m.label}-${i}`}>{m.label}</li>
            ))}
          </ul>
        ) : null}
      </VisuallyHidden>
    </div>
  );
});
