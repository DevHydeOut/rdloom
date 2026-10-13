"use client";

import { forwardRef, useEffect, useRef, type HTMLAttributes } from "react";
import { VisuallyHidden } from "react-aria-components";
import { dottedMapDefaults, type DottedMapSpecProps } from "../generated/dotted-map.types";
import { cx } from "../utils/cx";
import { fitCanvas, getContext2d, isStillNow, resolveColor, runLoop, useInView } from "../utils/canvas-effects";
import { isLand, MAP_BOTTOM_LAT, MAP_TOP_LAT } from "../utils/world-dots";

export interface DottedMapProps extends DottedMapSpecProps, Omit<HTMLAttributes<HTMLDivElement>, keyof DottedMapSpecProps | "className"> {
  className?: string;
}

const PULSE_SECONDS = 3.2;

type Point = [number, number];
interface Curve {
  a: Point;
  b: Point;
  cx: number;
  cy: number;
}

/**
 * A flat world map of land dots on a canvas, with optional markers and arcs that pulse between marker pairs.
 * The canvas is decoration (aria-hidden); the label, description, places and connections are visually hidden
 * lists. Paused while off-screen, one still frame (arcs drawn, no pulse) for reduced motion, rdm-still and
 * isPaused, and the frame loop is cancelled on unmount.
 */
export const DottedMap = forwardRef<HTMLDivElement, DottedMapProps>(function DottedMap(
  {
    label = dottedMapDefaults.label,
    description,
    markers,
    connections,
    dotSpacing = dottedMapDefaults.dotSpacing,
    dotColor,
    markerColor,
    isPaused = dottedMapDefaults.isPaused,
    className,
    ...rest
  },
  ref,
) {
  const root = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const inView = useInView(root);
  const known = new Set((markers ?? []).map((m) => m.label));
  const routes = (connections ?? []).filter((c) => known.has(c.from) && known.has(c.to));

  useEffect(() => {
    const host = root.current;
    const el = canvas.current;
    const ctx = getContext2d(el);
    if (!host || !el || !ctx) return;

    const land = resolveColor(host, dotColor ?? "var(--rd-color-text-muted)");
    const accent = resolveColor(host, markerColor ?? "var(--rd-color-action-primary)");
    const spacing = Math.max(3, dotSpacing);
    const span = MAP_TOP_LAT - MAP_BOTTOM_LAT;
    const byLabel = new Map((markers ?? []).map((m) => [m.label, m]));
    const pairs = (connections ?? []).flatMap((c) => {
      const from = byLabel.get(c.from);
      const to = byLabel.get(c.to);
      return from && to ? [{ from, to }] : [];
    });
    let width = 0;
    let height = 0;
    let time = 0;
    let cells: Point[] = [];

    const at = (lat: number, lng: number): Point => [((lng + 180) / 360) * width, ((MAP_TOP_LAT - lat) / span) * height];

    const measure = () => {
      const box = host.getBoundingClientRect();
      const next = fitCanvas(el, ctx, box.width, box.height);
      width = next.width;
      height = next.height;
      cells = [];
      for (let y = spacing / 2; y < height; y += spacing) {
        const lat = MAP_TOP_LAT - (y / height) * span;
        for (let x = spacing / 2; x < width; x += spacing) {
          if (isLand(lat, (x / width) * 360 - 180)) cells.push([x, y]);
        }
      }
    };

    const curveOf = (a: Point, b: Point): Curve => {
      const lift = Math.min(height * 0.4, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.3);
      return { a, b, cx: (a[0] + b[0]) / 2, cy: Math.min(a[1], b[1]) - lift };
    };
    const along = (c: Curve, t: number): Point => {
      const u = 1 - t;
      return [u * u * c.a[0] + 2 * u * t * c.cx + t * t * c.b[0], u * u * c.a[1] + 2 * u * t * c.cy + t * t * c.b[1]];
    };

    const paint = (animate: boolean) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = land;
      ctx.globalAlpha = 0.6;
      const r = Math.max(0.6, spacing * 0.2);
      for (const [x, y] of cells) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      const curves = pairs.map((p) => curveOf(at(p.from.lat, p.from.lng), at(p.to.lat, p.to.lng)));
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      for (const c of curves) {
        ctx.beginPath();
        ctx.moveTo(c.a[0], c.a[1]);
        ctx.quadraticCurveTo(c.cx, c.cy, c.b[0], c.b[1]);
        ctx.stroke();
      }
      ctx.fillStyle = accent;
      if (animate) {
        curves.forEach((c, i) => {
          const t = (((time / PULSE_SECONDS + i * 0.37) % 1) + 1) % 1;
          for (let k = 0; k < 6; k++) {
            const tt = t - k * 0.02;
            if (tt < 0) continue;
            const [x, y] = along(c, tt);
            ctx.globalAlpha = 0.9 - k * 0.14;
            ctx.beginPath();
            ctx.arc(x, y, Math.max(1, r * 1.6 - k * 0.15), 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
      for (const m of markers ?? []) {
        const [x, y] = at(m.lat, m.lng);
        const gradient = typeof ctx.createRadialGradient === "function" ? ctx.createRadialGradient(x, y, 0, x, y, r * 6) : null;
        if (gradient) {
          gradient.addColorStop(0, accent);
          gradient.addColorStop(1, "transparent");
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, r * 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = accent;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, r * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    measure();
    paint(false);
    const watcher =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            measure();
            paint(false);
          });
    watcher?.observe(host);

    const stop = runLoop({
      isStill: () => isStillNow(host, isPaused),
      isHidden: () => inView.current === false,
      still: () => paint(false),
      frame: (delta) => {
        time += delta / 1000;
        paint(true);
      },
    });

    return () => {
      stop();
      watcher?.disconnect();
    };
  }, [markers, connections, dotSpacing, dotColor, markerColor, isPaused, inView]);

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
      className={cx("rdm-dotted-map", className)}
    >
      <canvas ref={canvas} aria-hidden="true" className="rdm-dotted-map-canvas" />
      <VisuallyHidden elementType="div">
        {description ? <p>{description}</p> : null}
        {markers?.length ? (
          <ul>
            {markers.map((m, i) => (
              <li key={`${m.label}-${i}`}>{m.label}</li>
            ))}
          </ul>
        ) : null}
        {routes.length ? (
          <ul>
            {routes.map((c, i) => (
              <li key={`${c.from}-${c.to}-${i}`}>{`${c.from} to ${c.to}`}</li>
            ))}
          </ul>
        ) : null}
      </VisuallyHidden>
    </div>
  );
});
