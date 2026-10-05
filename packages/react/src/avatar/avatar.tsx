"use client";

import { forwardRef, useEffect, useState, type HTMLAttributes } from "react";
import { avatarDefaults, type AvatarSpecProps } from "../generated/avatar.types";
import { cx } from "../utils/cx";

export interface AvatarProps
  extends AvatarSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof AvatarSpecProps | "className"> {
  className?: string;
}

const sizes: Record<NonNullable<AvatarSpecProps["size"]>, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
};

/** "Ada Lovelace" -> "AL", "Ada" -> "A". Works on whole characters, so emoji and non-Latin names don't split. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = Array.from(words[0])[0] ?? "";
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? "") : "";
  return (first + last).toLocaleUpperCase();
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  {
    name,
    src,
    size = avatarDefaults.size,
    shape = avatarDefaults.shape,
    decorative = avatarDefaults.decorative,
    className,
    ...rest
  },
  ref,
) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]); // a new image gets a new chance
  const showImage = !!src && !failed;
  return (
    <span
      {...rest}
      ref={ref}
      // The image carries its own alt text; initials are text drawn as a picture.
      role={showImage || decorative ? undefined : "img"}
      aria-label={showImage || decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      className={cx(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden border border-[var(--rd-color-border-default)] " +
          "bg-[var(--rd-color-surface-subtle)] font-medium text-[var(--rd-color-text-default)]",
        shape === "circle" ? "rounded-full" : "rounded-[var(--rd-radius-control)]",
        sizes[size],
        className,
      )}
    >
      {showImage ? (
        <img src={src} alt={decorative ? "" : name} onError={() => setFailed(true)} className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
    </span>
  );
});
