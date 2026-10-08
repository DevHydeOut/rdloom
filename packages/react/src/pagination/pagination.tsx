"use client";

import { forwardRef, useState } from "react";
import { Button } from "react-aria-components";
import { paginationDefaults, type PaginationSpecProps } from "../generated/pagination.types";
import { cx } from "../utils/cx";
import { useMediaQuery } from "../utils/use-media-query";
import { ChevronRightIcon } from "../utils/icons";

export interface PaginationProps extends PaginationSpecProps {
  className?: string;
}

export type PaginationItem = number | "start-ellipsis" | "end-ellipsis";

/**
 * The buttons to show: every page when they fit, otherwise the first, the last,
 * the current page with `siblingCount` on each side, and an ellipsis for each gap.
 * It always returns the same number of items for a given count, so the control
 * doesn't change width as you move through the pages.
 */
export function paginationRange(page: number, pageCount: number, siblingCount = 1): PaginationItem[] {
  const total = Math.max(0, Math.floor(pageCount));
  const sibling = Math.max(0, Math.floor(siblingCount));
  const all = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
  const slots = sibling * 2 + 5; // first, last, current, two ellipses, and the siblings
  if (total <= slots) return all(1, total);

  const current = Math.min(Math.max(1, Math.floor(page)), total);
  const left = Math.max(current - sibling, 1);
  const right = Math.min(current + sibling, total);
  const gapLeft = left > 2;
  const gapRight = right < total - 1;
  const edge = 3 + sibling * 2; // pages shown next to the one ellipsis

  if (!gapLeft && gapRight) return [...all(1, edge), "end-ellipsis", total];
  if (gapLeft && !gapRight) return [1, "start-ellipsis", ...all(total - edge + 1, total)];
  return [1, "start-ellipsis", ...all(left, right), "end-ellipsis", total];
}

const sizes: Record<NonNullable<PaginationSpecProps["size"]>, string> = { sm: "h-8 min-w-8 px-2 text-sm", md: "h-10 min-w-10 px-3 text-sm" };

const shape =
  "inline-flex items-center justify-center rounded-[var(--rd-radius-control)] border font-medium tabular-nums select-none outline-none transition-colors " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] " +
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed";

// The colors are one set or the other, never both: two competing background
// utilities on one element are decided by stylesheet order, not by the order written.
const idle =
  "border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] " +
  "data-[hovered]:bg-[var(--rd-color-surface-subtle)]";

const current =
  "border-transparent bg-[var(--rd-color-action-primary)] text-[var(--rd-color-action-on-primary)] font-semibold " +
  "data-[hovered]:bg-[var(--rd-color-action-primary-hover)]";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <ChevronRightIcon className={cx("size-4 rtl:-scale-x-100", direction === "left" && "-scale-x-100 rtl:scale-x-100")} />
  );
}

export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    pageCount,
    page,
    defaultPage = paginationDefaults.defaultPage,
    onChange,
    siblingCount = paginationDefaults.siblingCount,
    label = paginationDefaults.label,
    size = paginationDefaults.size,
    isDisabled = paginationDefaults.isDisabled,
    className,
  },
  ref,
) {
  const narrow = useMediaQuery("(max-width: 479px)");
  const [inner, setInner] = useState(defaultPage);
  const count = Math.max(1, Math.floor(pageCount));
  const active = Math.min(Math.max(1, Math.floor(page ?? inner)), count);

  const go = (next: number) => {
    const target = Math.min(Math.max(1, next), count);
    if (target === active) return;
    if (page === undefined) setInner(target);
    onChange?.(target);
  };

  return (
    <nav ref={ref} aria-label={label} className={className}>
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          <Button aria-label="Previous page" isDisabled={isDisabled || active <= 1} onPress={() => go(active - 1)} className={cx(shape, idle, sizes[size])}>
            <Chevron direction="left" />
          </Button>
        </li>
        {paginationRange(active, count, narrow ? 0 : siblingCount).map((item) =>
          typeof item === "string" ? (
            <li key={item} aria-hidden="true" className="px-1 text-[var(--rd-color-text-muted)] select-none">
              …
            </li>
          ) : (
            <li key={item}>
              <Button
                aria-label={`Page ${item}`}
                aria-current={item === active ? "page" : undefined}
                isDisabled={isDisabled}
                onPress={() => go(item)}
                className={cx(shape, item === active ? current : idle, sizes[size])}
              >
                {item}
              </Button>
            </li>
          ),
        )}
        <li>
          <Button aria-label="Next page" isDisabled={isDisabled || active >= count} onPress={() => go(active + 1)} className={cx(shape, idle, sizes[size])}>
            <Chevron direction="right" />
          </Button>
        </li>
      </ul>
    </nav>
  );
});
