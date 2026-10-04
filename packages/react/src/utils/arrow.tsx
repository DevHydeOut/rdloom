"use client";

import { OverlayArrow } from "react-aria-components";
import { cx } from "./cx";

/** Arrow for Popover and Tooltip. It rotates to face the trigger. */
export function Arrow({ className }: { className?: string }) {
  return (
    <OverlayArrow>
      <svg
        width={12}
        height={12}
        viewBox="0 0 12 12"
        aria-hidden="true"
        className={cx(
          "block [[data-placement=bottom]>&]:rotate-180 [[data-placement=left]>&]:-rotate-90 [[data-placement=right]>&]:rotate-90",
          className,
        )}
      >
        <path d="M0 0 L6 6 L12 0" />
      </svg>
    </OverlayArrow>
  );
}
