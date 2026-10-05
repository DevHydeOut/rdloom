"use client";

import { forwardRef, useMemo } from "react";
import { responseDefaults, type ResponseSpecProps } from "../generated/response.types";
import { cx } from "../utils/cx";
import { renderBlocks } from "./markdown";

export interface ResponseProps extends ResponseSpecProps {
  className?: string;
}

/**
 * Shows an assistant's markdown reply. It is safe for text you don't control (no HTML is
 * injected) and for text that is still arriving: pass `isStreaming` while it streams.
 */
export const Response = forwardRef<HTMLDivElement, ResponseProps>(function Response(
  { children, isStreaming = responseDefaults.isStreaming, citations, headingLevel = responseDefaults.headingLevel, className },
  ref,
) {
  // Reading the markdown is the costly part of every streamed chunk: skip it when nothing it depends on changed.
  const content = useMemo(() => renderBlocks(children, { headingStart: Math.min(6, Math.max(2, headingLevel)), citations }), [children, headingLevel, citations]);
  return (
    <div
      ref={ref}
      // aria-busy tells assistive tech the content is still changing, so it reads the finished text, not each fragment.
      aria-busy={isStreaming || undefined}
      data-streaming={isStreaming || undefined}
      className={cx("min-w-0 break-words text-[var(--rd-color-text-default)] leading-relaxed", className)}
    >
      {content}
      {isStreaming && (
        <span aria-hidden="true" className="ms-0.5 inline-block h-[1.1em] w-[2px] translate-y-[0.2em] animate-pulse bg-current motion-reduce:animate-none" />
      )}
    </div>
  );
});
