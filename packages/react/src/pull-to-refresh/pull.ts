// The arithmetic of a pull, with no React and no DOM, so it can be tested without a browser.

/** The finger must move this far before the gesture is read as a pull or as something else. */
export const PULL_LOCK_PX = 8;
/** How much of the finger's travel counts, before the pull starts to resist. */
export const RESISTANCE = 0.7;
/** The longest pull is this many times the threshold. */
export const MAX_PULL_RATIO = 3;
/** How far the content moves while a refresh runs, as a share of the threshold. */
export const HOLD_RATIO = 1;
/** The height of the message and button shown after a refresh failed. */
export const FAILED_HEIGHT = 56;

/**
 * How far the content moves for a given finger travel. It follows the finger at first, then pulls harder
 * and harder against it and never passes `max`, so a long pull feels like stretching, not like dragging.
 */
export function pullDistance(travel: number, max: number, resistance = RESISTANCE): number {
  if (travel <= 0 || max <= 0) return 0;
  const pulled = travel * resistance;
  return (max * pulled) / (max + pulled);
}

/** True when the content has been pulled far enough that letting go refreshes. */
export const isPastThreshold = (distance: number, threshold: number) => distance >= threshold;

/** What the pull says to do, for the message beside the arrow. */
export type PullPhase = "idle" | "pulling" | "ready" | "refreshing";

export function phaseOf(distance: number, threshold: number, refreshing: boolean): PullPhase {
  if (refreshing) return "refreshing";
  if (distance <= 0) return "idle";
  return isPastThreshold(distance, threshold) ? "ready" : "pulling";
}

/**
 * How far the arrow has turned, as a share of a half turn: it points down while pulling and has
 * turned up by the time the threshold is reached, to say "let go now".
 */
export const arrowProgress = (distance: number, threshold: number) => (threshold <= 0 ? 1 : Math.min(1, Math.max(0, distance / threshold)));
