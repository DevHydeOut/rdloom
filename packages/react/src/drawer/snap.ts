// The arithmetic of a sheet that rests at several heights, with no React and no DOM, so it can be
// tested without a browser. Heights are in pixels; a drag up makes the sheet taller.

/** How long a flick carries on after the finger lifts, in milliseconds of travel at the release speed. */
export const PROJECTION_MS = 150;
/** Slower than this (px per ms) a release is a drag, not a flick. */
export const FLICK_SPEED = 0.4;
/** The lowest and highest share of the space a snap point may take. */
export const MIN_SNAP = 0.1;
export const MAX_SNAP = 1;

/**
 * The snap points as people may set them (shares of the available height, such as 0.4 and 0.9), made safe:
 * numbers only, kept inside 0.1 to 1, smallest first, without repeats.
 */
export function cleanSnapPoints(points: readonly number[] | undefined): number[] {
  if (!points) return [];
  const safe = points.filter((p) => Number.isFinite(p)).map((p) => Math.min(MAX_SNAP, Math.max(MIN_SNAP, p)));
  return Array.from(new Set(safe)).sort((a, b) => a - b);
}

/** The resting heights in pixels for the available space. */
export const snapHeights = (points: readonly number[], space: number): number[] => points.map((p) => Math.round(p * space));

/** A snap index kept inside the list. */
export const clampIndex = (index: number, count: number) => (count <= 0 ? 0 : Math.min(count - 1, Math.max(0, Math.round(index))));

/**
 * The height while the finger is down. Above the tallest snap the sheet stretches a little and pulls
 * back; below the shortest it follows the finger down, to nothing, when it can be dismissed and stops at
 * the shortest when it cannot.
 */
export function dragHeight(base: number, travelUp: number, heights: readonly number[], dismissable: boolean): number {
  const raw = base + travelUp;
  const lowest = heights[0] ?? 0;
  const highest = heights[heights.length - 1] ?? 0;
  if (raw > highest) return highest + Math.min(raw - highest, 24) * 0.35;
  if (raw < lowest) return dismissable ? Math.max(0, raw) : lowest;
  return raw;
}

export interface SnapRelease {
  /** The snap point to settle on, or null to close the sheet. */
  index: number | null;
}

/**
 * What happens when the finger lifts. A flick carries the sheet on a little, then it settles on the
 * nearest snap point. If it ends up well below the shortest one and the sheet can be dismissed, it closes.
 * `velocity` is px per ms, positive when the sheet was moving up.
 */
export function resolveSnap(input: { height: number; velocity: number; heights: readonly number[]; dismissable: boolean }): SnapRelease {
  const { height, velocity, heights, dismissable } = input;
  if (heights.length === 0) return { index: 0 };
  const projected = Math.abs(velocity) >= FLICK_SPEED ? height + velocity * PROJECTION_MS : height;
  const lowest = heights[0];
  // Past halfway between the shortest height and nothing: let it go.
  if (dismissable && projected < lowest * 0.5) return { index: null };
  let best = 0;
  for (let i = 1; i < heights.length; i++) if (Math.abs(heights[i] - projected) < Math.abs(heights[best] - projected)) best = i;
  return { index: best };
}

/** The next snap point up or down from this one, staying inside the list. */
export const stepIndex = (index: number, count: number, direction: 1 | -1) => clampIndex(index + direction, count);
