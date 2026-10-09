"use client";

import { forwardRef, useEffect, useRef, useState, type HTMLAttributes } from "react";
import { pixelImageDefaults, type PixelImageSpecProps } from "../generated/pixel-image.types";
import { cx } from "../utils/cx";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "../utils/motion";

export interface PixelImageProps extends PixelImageSpecProps, Omit<HTMLAttributes<HTMLDivElement>, keyof PixelImageSpecProps | "className"> {
  className?: string;
}

type Phase = "sharp" | "waiting" | "running";

/** Draw the image as blocks of the given size onto the canvas, by shrinking it and stretching it back without smoothing. */
function drawBlocks(canvas: HTMLCanvasElement, img: HTMLImageElement, block: number) {
  const width = img.clientWidth;
  const height = img.clientHeight;
  if (!width || !height || !img.naturalWidth) return false;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext("2d");
  } catch {
    return false;
  }
  if (!ctx) return false;
  canvas.width = width;
  canvas.height = height;
  const cols = Math.max(1, Math.ceil(width / block));
  const rows = Math.max(1, Math.ceil(height / block));
  // Which part of the picture is on screen: all of it, or the centred crop that object-fit: cover shows.
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (getComputedStyle(img).objectFit === "cover") {
    const scale = Math.max(width / sw, height / sh);
    sw = width / scale;
    sh = height / scale;
    sx = (img.naturalWidth - sw) / 2;
    sy = (img.naturalHeight - sh) / 2;
  }
  const small = document.createElement("canvas");
  small.width = cols;
  small.height = rows;
  const sctx = small.getContext("2d");
  if (!sctx) return false;
  sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, cols, rows, 0, 0, cols * block, rows * block);
  return true;
}

/**
 * An image that resolves from coarse blocks to sharp. The real image is always rendered (it is all
 * the server sends); after mount a hidden canvas of blocks is laid over it, stepped finer, then
 * removed. Anything that goes wrong leaves the image showing.
 */
export const PixelImage = forwardRef<HTMLDivElement, PixelImageProps>(function PixelImage(
  {
    children,
    src,
    alt,
    blockSize = pixelImageDefaults.blockSize,
    duration = pixelImageDefaults.duration,
    whenInView = pixelImageDefaults.whenInView,
    isStill = pixelImageDefaults.isStill,
    className,
    ...rest
  },
  forwarded,
) {
  const root = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("sharp");

  const image = () => root.current?.querySelector("img") ?? null;

  useIsomorphicLayoutEffect(() => {
    if (isStill || prefersReducedMotion() || root.current?.closest(".rdm-still")) return;
    setPhase("waiting");
  }, [isStill]);

  // Show the coarsest blocks while waiting, then step finer. Any failure drops back to the sharp image.
  useEffect(() => {
    if (phase === "sharp") return;
    const img = image();
    const cv = canvas.current;
    if (!img || !cv) {
      setPhase("sharp");
      return;
    }
    const first = Math.max(2, Math.round(blockSize));
    const sizes: number[] = [];
    for (let b = first; b >= 2; b = Math.floor(b / 2)) sizes.push(b);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let watcher: IntersectionObserver | undefined;
    let cancelled = false;

    const finish = () => !cancelled && setPhase("sharp");
    const step = (index: number) => {
      if (cancelled) return;
      if (index >= sizes.length || root.current?.closest(".rdm-still")) return finish();
      if (!drawBlocks(cv, img, sizes[index])) return finish();
      timer = setTimeout(() => step(index + 1), (duration * 1000) / sizes.length);
    };
    const begin = () => {
      if (phase === "waiting") {
        if (!drawBlocks(cv, img, sizes[0])) return finish();
        if (whenInView && typeof IntersectionObserver !== "undefined" && root.current) {
          watcher = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            watcher?.disconnect();
            setPhase("running");
          });
          watcher.observe(root.current);
        } else {
          setPhase("running");
        }
      } else {
        step(0);
      }
    };

    if (img.complete) begin();
    else {
      img.addEventListener("load", begin, { once: true });
      img.addEventListener("error", finish, { once: true });
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
      watcher?.disconnect();
      img.removeEventListener("load", begin);
      img.removeEventListener("error", finish);
    };
  }, [phase, blockSize, duration, whenInView]);

  // Stopping from outside (isStill turned on) shows the sharp image at once.
  useEffect(() => {
    if (isStill) setPhase("sharp");
  }, [isStill]);

  return (
    <div
      {...rest}
      ref={(node) => {
        root.current = node;
        if (typeof forwarded === "function") forwarded(node);
        else if (forwarded) forwarded.current = node;
      }}
      data-pixel={phase}
      className={cx("rdm-pixel relative block w-fit max-w-full overflow-hidden", className)}
    >
      {children ?? (src ? <img src={src} alt={alt ?? ""} className="block h-auto w-full" /> : null)}
      {phase !== "sharp" ? <canvas ref={canvas} aria-hidden="true" className="rdm-pixel-canvas" /> : null}
    </div>
  );
});
