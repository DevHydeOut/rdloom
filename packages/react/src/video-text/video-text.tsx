"use client";

import { forwardRef, useEffect, useState, type CSSProperties, type HTMLAttributes } from "react";
import { videoTextDefaults, type VideoTextSpecProps } from "../generated/video-text.types";
import { cx } from "../utils/cx";
import { useReducedMotion } from "../utils/motion";

export interface VideoTextProps
  extends VideoTextSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof VideoTextSpecProps | "className" | "children"> {
  className?: string;
}

/**
 * Large text that shows a video through its letters. You supply the video (src); none is bundled. The
 * text is real text. Until the video has loaded, and whenever it is paused, blocked by reduced motion
 * or fails, the letters show the fallback gradient, painted with background-clip. The video is added
 * after mount, so the server HTML has no video and nothing is fetched without JavaScript.
 */
export const VideoText = forwardRef<HTMLSpanElement, VideoTextProps>(function VideoText(
  { children, src, poster, fallback = videoTextDefaults.fallback, tone = videoTextDefaults.tone, isPaused = videoTextDefaults.isPaused, className, style, ...rest },
  ref,
) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setMounted(true), []);
  const useVideo = Boolean(src) && mounted && !isPaused && !reduced;
  useEffect(() => {
    if (!useVideo) setReady(false);
  }, [useVideo]);

  return (
    <span
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      data-rdm-video={useVideo && ready ? "on" : undefined}
      data-tone={tone}
      className={cx("rdm-video-text", className)}
      style={{ "--rdm-fb": fallback, ...style } as CSSProperties}
    >
      {useVideo ? (
        <video
          aria-hidden="true"
          tabIndex={-1}
          className="rdm-video-text-video"
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          onLoadedData={() => setReady(true)}
          onError={() => setReady(false)}
        />
      ) : null}
      <span className="rdm-video-text-label">{children}</span>
    </span>
  );
});
