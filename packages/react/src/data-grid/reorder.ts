import type { DataGridRowMove } from "./types";

/**
 * A copy of `rows` with one row moved: the result to keep when onRowReorder
 * fires. Also takes the move itself: `reorderRows(rows, move)`.
 */
export function reorderRows<T>(rows: readonly T[], from: number | DataGridRowMove, to?: number): T[] {
  const fromIndex = typeof from === "number" ? from : from.fromIndex;
  const toIndex = typeof from === "number" ? (to ?? fromIndex) : from.toIndex;
  const next = [...rows];
  if (fromIndex < 0 || fromIndex >= next.length) return next;
  const [moved] = next.splice(fromIndex, 1);
  next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, moved);
  return next;
}
