"use client";

import { forwardRef, type ReactNode } from "react";
import { Button as AriaButton } from "react-aria-components";
import { heroVideoDialogDefaults, type HeroVideoDialogSpecProps } from "../generated/hero-video-dialog.types";
import { Button } from "../button/button";
import { Dialog, DialogTrigger } from "../dialog/dialog";
import { cx } from "../utils/cx";
import { PlayIcon } from "../utils/icons";

export interface HeroVideoDialogProps extends HeroVideoDialogSpecProps {
  className?: string;
}

/**
 * A poster thumbnail that opens your video in a dialog. The video element is only rendered while the
 * dialog is open, so nothing is downloaded before the visitor asks. Focus returns to the thumbnail on close.
 */
export const HeroVideoDialog = forwardRef<HTMLButtonElement, HeroVideoDialogProps>(function HeroVideoDialog(
  { videoSrc, title, poster, tracks, isStill = heroVideoDialogDefaults.isStill, className },
  ref,
) {
  const art: ReactNode = typeof poster === "string" ? <img src={poster} alt="" className="size-full object-cover" /> : poster;
  return (
    <DialogTrigger>
      <AriaButton
        ref={ref}
        aria-label={`Play video: ${title}`}
        data-rdm-still={isStill || undefined}
        className={cx(
          "rdm-hvd group relative block aspect-video w-full overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] " +
            "bg-[var(--rd-color-surface-subtle)] outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
          className,
        )}
      >
        <span aria-hidden="true" className="rdm-hvd-poster absolute inset-0 block">
          {art}
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] [box-shadow:var(--rd-elevation-overlay)]"
        >
          <PlayIcon className="size-6 shrink-0" />
        </span>
      </AriaButton>
      <Dialog title={title} size="lg">
        {({ close }) => (
          <>
            <video src={videoSrc} controls autoPlay playsInline preload="metadata" className="aspect-video w-full rounded-[var(--rd-radius-control)] bg-black">
              {tracks}
              Your browser cannot play this video.
            </video>
            <div className="flex justify-end">
              <Button variant="secondary" onPress={close}>
                Close
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </DialogTrigger>
  );
});
