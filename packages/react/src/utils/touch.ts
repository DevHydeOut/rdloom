// Tap targets. The size comes from a token: it is 0 by default, so nothing changes, and 44px under
// data-density="touch" (or "auto" on a phone or tablet), so small controls grow to what a finger needs.
// Use `touchTarget` on an element that is sized with width and height (or size-*), and `touchHeight` for
// one that only needs to be tall enough. An element that already sets min-width or min-height has to put the
// token inside max(...) itself, because two min-width utilities on one element are decided by the order of
// the stylesheet, not the order they are written.

/** At least the tap target size in both directions. */
export const touchTarget = "min-h-[var(--rd-size-touch-target)] min-w-[var(--rd-size-touch-target)]";

/** At least the tap target size in height only, for a link that is as wide as its text. */
export const touchHeight = "min-h-[var(--rd-size-touch-target)]";

/**
 * Grows the area that can be tapped without growing the element: a transparent box centered on it, at least
 * the tap target size. For a small button inside something that must not get taller, such as a chip. The
 * element needs `relative` (this class adds it).
 */
export const touchHitArea =
  "relative after:absolute after:left-1/2 after:top-1/2 after:size-[max(100%,var(--rd-size-touch-target))] after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']";
