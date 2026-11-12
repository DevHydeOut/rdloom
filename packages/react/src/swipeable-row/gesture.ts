// The arithmetic of a swipe, with no React and no DOM, so it can be tested without a browser.
//
// Positions are logical, in pixels: 0 is the row at rest, a positive number is the row pushed toward
// the start side (which shows the start actions) and a negative number is the row pulled toward the end
// side (which shows the end actions). The component turns that into a left or right move for the
// reading direction.

export type SwipeSide = "start" | "end";

/** How far a flick carries on after the finger lifts, in milliseconds of travel at the release speed. */
export const PROJECTION_MS = 150;
/** Slower than this (px per ms) a release is a drag, not a flick. */
export const FLICK_SPEED = 0.4;
/** The pointer must move this far before the gesture is read as horizontal or vertical. */
export const AXIS_LOCK_PX = 8;
/** The width given to each action, in pixels. */
export const ACTION_WIDTH = 80;
/** A full swipe has to pass this share of the row's width. */
export const FULL_SWIPE_RATIO = 0.6;

export interface Widths {
  /** Total width of the start actions, 0 when there are none. */
  start: number;
  /** Total width of the end actions, 0 when there are none. */
  end: number;
}

/** Where the row rests for an open side. */
export function restingPosition(side: SwipeSide | null, widths: Widths): number {
  return side === "start" ? widths.start : side === "end" ? -widths.end : 0;
}

/**
 * The position while the finger is down: the rest position plus the finger's travel, kept inside what
 * the actions allow. A side with no actions does not move at all, and the side with actions stretches a
 * little past its edge and pulls back, so the row feels attached to the finger without tearing loose.
 * With `reach` (the row's width, for a full swipe) the row follows the finger as far as that instead,
 * so a long swipe can get to the point where it runs the first action.
 */
export function dragPosition(rest: number, travel: number, widths: Widths, reach = 0): number {
  const raw = rest + travel;
  const overshoot = (over: number) => Math.min(over, 24) * 0.35;
  if (raw > widths.start) {
    if (widths.start === 0) return 0;
    return reach > 0 ? Math.min(raw, reach) : widths.start + overshoot(raw - widths.start);
  }
  if (raw < -widths.end) {
    if (widths.end === 0) return 0;
    return reach > 0 ? Math.max(raw, -reach) : -widths.end - overshoot(-widths.end - raw);
  }
  return raw;
}

export interface Release {
  /** The side to leave open, or null to close. */
  side: SwipeSide | null;
  /** True when the swipe went far enough to run the first action of that side. */
  full: boolean;
}

/**
 * What happens when the finger lifts. A flick carries the row on a little, then it settles on the
 * nearest of the places it may rest: closed, or open on a side that has actions. Going past most of
 * the row's width runs the first action when `fullSwipe` is on.
 */
export function resolveRelease(input: { position: number; velocity: number; widths: Widths; rowWidth: number; fullSwipe: boolean }): Release {
  const { position, velocity, widths, rowWidth, fullSwipe } = input;
  if (fullSwipe && rowWidth > 0) {
    const limit = rowWidth * FULL_SWIPE_RATIO;
    if (position >= limit && widths.start > 0) return { side: "start", full: true };
    if (position <= -limit && widths.end > 0) return { side: "end", full: true };
  }
  // A slow release settles where the row is; a flick adds the distance it would still travel.
  const projected = Math.abs(velocity) >= FLICK_SPEED ? position + velocity * PROJECTION_MS : position;
  const places: Array<{ side: SwipeSide | null; at: number }> = [{ side: null, at: 0 }];
  if (widths.start > 0) places.push({ side: "start", at: widths.start });
  if (widths.end > 0) places.push({ side: "end", at: -widths.end });
  let best = places[0];
  for (const place of places) if (Math.abs(place.at - projected) < Math.abs(best.at - projected)) best = place;
  return { side: best.side, full: false };
}

/** The total width of a side with this many actions. */
export const widthOf = (count: number) => count * ACTION_WIDTH;
