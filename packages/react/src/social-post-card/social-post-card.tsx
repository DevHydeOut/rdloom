"use client";

import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import { Button } from "react-aria-components";
import { socialPostCardDefaults, type SocialPostCardSpecProps } from "../generated/social-post-card.types";
import { cx } from "../utils/cx";
import { CommentIcon, HeartIcon, RepeatIcon } from "../utils/icons";
import { plainSpaces, useDefaultLocale } from "../utils/use-default-locale";

export interface SocialPostCardProps
  extends SocialPostCardSpecProps,
    Omit<HTMLAttributes<HTMLElement>, keyof SocialPostCardSpecProps | "className" | "children"> {
  className?: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0])
    .join("")
    .toUpperCase();
}

/**
 * A generic social post as an article: author, time, body, optional media and link preview slots,
 * and real buttons for reply, repost and like. Counts are formatted with the default locale.
 */
export const SocialPostCard = forwardRef<HTMLElement, SocialPostCardProps>(function SocialPostCard(
  {
    name,
    handle,
    avatarSrc,
    timestamp,
    dateTime,
    children,
    media,
    linkPreview,
    replyCount,
    repostCount,
    likeCount,
    isLiked = socialPostCardDefaults.isLiked,
    isReposted = socialPostCardDefaults.isReposted,
    onReply,
    onRepost,
    onLike,
    variant = socialPostCardDefaults.variant,
    locale,
    className,
    ...rest
  },
  ref,
) {
  const nameId = useId();
  const lang = useDefaultLocale(locale);
  const compact = variant === "compact";
  const short = new Intl.NumberFormat(lang, { notation: "compact", maximumFractionDigits: 1 });
  const full = new Intl.NumberFormat(lang);
  const shown = handle ? (handle.startsWith("@") ? handle : `@${handle}`) : undefined;

  const action = (
    key: string,
    verb: string,
    noun: [string, string],
    icon: ReactNode,
    count: number | undefined,
    onPress: (() => void) | undefined,
    pressed?: boolean,
  ) => {
    if (!onPress) return null;
    const suffix = count === undefined ? "" : `, ${plainSpaces(full.format(count))} ${count === 1 ? noun[0] : noun[1]}`;
    return (
      <Button
        key={key}
        onPress={onPress}
        aria-label={`${verb}${suffix}`}
        aria-pressed={pressed}
        data-on={pressed || undefined}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--rd-radius-control)] px-2 text-sm text-[var(--rd-color-text-muted)] outline-none motion-reduce:transition-none data-[hovered]:bg-[var(--rd-color-surface-selected)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[on]:text-[var(--rd-color-action-primary)]"
      >
        {icon}
        {count !== undefined ? <span aria-hidden="true">{plainSpaces(short.format(count))}</span> : null}
      </Button>
    );
  };

  const buttons = [
    action("reply", "Reply", ["reply", "replies"], <CommentIcon />, replyCount, onReply),
    action("repost", "Repost", ["repost", "reposts"], <RepeatIcon />, repostCount, onRepost, isReposted),
    action("like", "Like", ["like", "likes"], <HeartIcon filled={isLiked} />, likeCount, onLike, isLiked),
  ].filter(Boolean);

  const slot = "overflow-hidden rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)]";

  return (
    <article
      {...rest}
      ref={ref}
      aria-labelledby={rest["aria-labelledby"] ?? nameId}
      data-variant={variant}
      className={cx(
        "rd-social-post flex w-full max-w-xl flex-col rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)]",
        compact ? "gap-2 p-3 text-sm" : "gap-3 p-4",
        className,
      )}
    >
      <header className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cx(
            "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] text-xs font-semibold",
            compact ? "size-8" : "size-10",
          )}
        >
          {avatarSrc ? <img src={avatarSrc} alt="" className="size-full object-cover" /> : initials(name)}
        </span>
        <div className="flex min-w-0 flex-col">
          <span id={nameId} className="truncate font-semibold">
            {name}
          </span>
          <span className="flex min-w-0 gap-1 text-[var(--rd-color-text-muted)]">
            {shown ? <span className="truncate">{shown}</span> : null}
            {shown && timestamp ? <span aria-hidden="true">·</span> : null}
            {timestamp ? <time dateTime={dateTime}>{timestamp}</time> : null}
          </span>
        </div>
      </header>
      <div className="m-0 whitespace-pre-line break-words">{children}</div>
      {media ? <div className={slot}>{media}</div> : null}
      {linkPreview ? <div className={slot}>{linkPreview}</div> : null}
      {buttons.length ? <div className="-ms-2 flex flex-wrap items-center gap-1">{buttons}</div> : null}
    </article>
  );
});
