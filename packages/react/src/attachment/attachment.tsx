"use client";

import { createContext, forwardRef, useContext, type HTMLAttributes } from "react";
import { Button as AriaButton, Link as AriaLink, ProgressBar as AriaProgressBar } from "react-aria-components";
import { attachmentDefaults, type AttachmentSpecProps } from "../generated/attachment.types";
import { cx } from "../utils/cx";
import { ArchiveIcon, CloseIcon, ErrorIcon, FileIcon, ImageIcon } from "../utils/icons";

export interface AttachmentProps
  extends AttachmentSpecProps,
    Omit<HTMLAttributes<HTMLElement>, keyof AttachmentSpecProps | "className" | "children" | "role"> {
  className?: string;
}

const InList = createContext(false);

const focusRing = "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

function TypeIcon({ mediaType, className }: { mediaType?: string; className: string }) {
  if (mediaType?.startsWith("image/")) return <ImageIcon className={className} />;
  if (mediaType && /zip|tar|gzip|compressed|rar|7z/.test(mediaType)) return <ArchiveIcon className={className} />;
  return <FileIcon className={className} />;
}

/** A file attached to a prompt or a message. Inside AttachmentList it is a list item; on its own it is a plain group. */
export const Attachment = forwardRef<HTMLElement, AttachmentProps>(function Attachment(
  {
    name,
    sizeText,
    mediaType,
    variant = attachmentDefaults.variant,
    status = attachmentDefaults.status,
    progress,
    errorMessage = attachmentDefaults.errorMessage,
    thumbnail,
    href,
    onPress,
    onRemove,
    className,
    ...rest
  },
  ref,
) {
  const inList = useContext(InList);
  const preview = variant === "preview";
  const uploading = status === "uploading";
  const failed = status === "error";
  const Root = (inList ? "li" : "div") as "div";

  const nameClass = cx("truncate text-sm font-medium text-[var(--rd-color-text-default)]", (href || onPress) && "rounded underline-offset-2 data-[hovered]:underline", focusRing);
  const nameNode = href ? (
    <AriaLink href={href} className={nameClass}>
      {name}
    </AriaLink>
  ) : onPress ? (
    <AriaButton onPress={onPress} className={cx(nameClass, "block max-w-full text-start")}>
      {name}
    </AriaButton>
  ) : (
    <span className={nameClass}>{name}</span>
  );

  const clamped = progress === undefined ? undefined : Math.min(100, Math.max(0, progress));

  return (
    <Root
      {...rest}
      ref={ref as never}
      data-status={status}
      data-variant={variant}
      className={cx(
        "relative border bg-[var(--rd-color-surface-subtle)]",
        failed ? "border-[var(--rd-color-feedback-danger)]" : "border-[var(--rd-color-border-default)]",
        preview ? "flex w-40 flex-col overflow-hidden rounded-[var(--rd-radius-overlay)]" : "flex max-w-xs items-center gap-2.5 rounded-[var(--rd-radius-control)] py-2 ps-2.5 pe-2",
        className,
      )}
    >
      {preview && (
        <div className="flex h-24 w-full items-center justify-center overflow-hidden bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-muted)] [&_img]:size-full [&_img]:object-cover">
          {thumbnail ?? <TypeIcon mediaType={mediaType} className="size-8 shrink-0" />}
        </div>
      )}
      <div className={cx("flex min-w-0 items-center gap-2.5", preview ? "p-2.5 pe-9" : "flex-1")}>
        {!preview && <TypeIcon mediaType={mediaType} className="size-5 shrink-0 text-[var(--rd-color-text-muted)]" />}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {nameNode}
          {failed ? (
            <p role="alert" className="inline-flex items-center gap-1 text-xs text-[var(--rd-color-feedback-danger)]">
              <ErrorIcon className="size-3.5 shrink-0" />
              {errorMessage}
            </p>
          ) : (
            sizeText && <span className="text-xs text-[var(--rd-color-text-muted)]">{sizeText}</span>
          )}
          {uploading && (
            <AriaProgressBar
              aria-label={`Uploading ${name}`}
              value={clamped}
              isIndeterminate={clamped === undefined}
              className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--rd-color-border-default)]"
            >
              {({ percentage, isIndeterminate }) => (
                <div
                  className={cx(
                    "h-full rounded-full bg-[var(--rd-color-action-primary)] transition-[width] duration-150 motion-reduce:transition-none",
                    isIndeterminate && "w-1/3 animate-pulse motion-reduce:animate-none",
                  )}
                  style={isIndeterminate ? undefined : { width: `${percentage ?? 0}%` }}
                />
              )}
            </AriaProgressBar>
          )}
        </div>
      </div>
      {onRemove && (
        <AriaButton
          aria-label={`Remove ${name}`}
          onPress={onRemove}
          className={cx(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-[var(--rd-color-text-muted)] data-[hovered]:bg-[var(--rd-color-border-default)] data-[hovered]:text-[var(--rd-color-text-default)]",
            preview && "absolute end-1.5 bottom-2 bg-[var(--rd-color-surface-default)]",
            focusRing,
          )}
        >
          <CloseIcon className="size-3" />
        </AriaButton>
      )}
    </Root>
  );
});

export interface AttachmentListProps extends Omit<HTMLAttributes<HTMLUListElement>, "className" | "role"> {
  className?: string;
}

/** A list of attachments that wraps onto several lines. Name it with aria-label (default "Attachments"). */
export const AttachmentList = forwardRef<HTMLUListElement, AttachmentListProps>(function AttachmentList(
  { className, "aria-label": label = "Attachments", children, ...rest },
  ref,
) {
  return (
    <InList.Provider value={true}>
      <ul {...rest} ref={ref} role="list" aria-label={label} className={cx("m-0 flex list-none flex-wrap gap-2 p-0", className)}>
        {children}
      </ul>
    </InList.Provider>
  );
});
