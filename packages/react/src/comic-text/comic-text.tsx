"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { comicTextDefaults, type ComicTextSpecProps } from "../generated/comic-text.types";
import { cx } from "../utils/cx";

export interface ComicTextProps
  extends ComicTextSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof ComicTextSpecProps | "className" | "children"> {
  className?: string;
}

/**
 * Bold, outlined text with a hard offset shadow. Pure CSS and real text. The optional pop-in plays once
 * when the element first appears; reduced motion and isPaused skip it.
 */
export const ComicText = forwardRef<HTMLSpanElement, ComicTextProps>(function ComicText(
  { children, popIn = comicTextDefaults.popIn, fill = comicTextDefaults.fill, outline = comicTextDefaults.outline, isPaused = comicTextDefaults.isPaused, className, style, ...rest },
  ref,
) {
  return (
    <span
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      data-pop={popIn || undefined}
      className={cx("rdm-comic", className)}
      style={{ "--rdm-fill": fill, "--rdm-line": outline, ...style } as CSSProperties}
    >
      {children}
    </span>
  );
});
