import { describe, expect, it } from "vitest";
import { ACTION_WIDTH, FULL_SWIPE_RATIO, dragPosition, resolveRelease, restingPosition, widthOf } from "../src/swipeable-row/gesture";

const both = { start: 80, end: 160 };
const endOnly = { start: 0, end: 80 };

describe("swipe positions", () => {
  it("gives every action the same width", () => {
    expect([0, 1, 2, 3].map(widthOf)).toEqual([0, ACTION_WIDTH, ACTION_WIDTH * 2, ACTION_WIDTH * 3]);
  });

  it("rests at zero, at the start width, or at minus the end width", () => {
    expect(restingPosition(null, both)).toBe(0);
    expect(restingPosition("start", both)).toBe(80);
    expect(restingPosition("end", both)).toBe(-160);
  });
});

describe("dragPosition", () => {
  it("follows the finger inside the range", () => {
    expect(dragPosition(0, 40, both)).toBe(40);
    expect(dragPosition(0, -100, both)).toBe(-100);
    expect(dragPosition(-160, 60, both)).toBe(-100);
  });

  it("stretches a little past an edge and pulls back, never tearing loose", () => {
    const past = dragPosition(0, 80 + 20, both);
    expect(past).toBeGreaterThan(80);
    expect(past).toBeLessThan(80 + 20);
    // However far the finger goes, the stretch is capped.
    expect(dragPosition(0, 5000, both)).toBeLessThan(80 + 9);
    expect(dragPosition(0, -5000, both)).toBeGreaterThan(-160 - 9);
  });

  it("follows the finger as far as the row is wide when a full swipe is on", () => {
    expect(dragPosition(0, -250, both, 320)).toBe(-250);
    expect(dragPosition(0, -900, both, 320)).toBe(-320);
    expect(dragPosition(0, 200, both, 320)).toBe(200);
    // Still nothing toward a side without actions.
    expect(dragPosition(0, 200, endOnly, 320)).toBe(0);
  });

  it("does not move at all toward a side with no actions", () => {
    expect(dragPosition(0, 60, endOnly)).toBe(0);
    expect(dragPosition(0, -60, { start: 80, end: 0 })).toBe(0);
    expect(dragPosition(0, -60, endOnly)).toBe(-60);
  });
});

describe("resolveRelease", () => {
  const release = (position: number, velocity = 0, widths = both, extra: { rowWidth?: number; fullSwipe?: boolean } = {}) =>
    resolveRelease({ position, velocity, widths, rowWidth: 320, fullSwipe: false, ...extra });

  it("settles on the nearest place when let go slowly", () => {
    expect(release(30).side).toBe(null);
    expect(release(50).side).toBe("start");
    expect(release(-70).side).toBe(null);
    expect(release(-90).side).toBe("end");
    expect(release(-160).side).toBe("end");
  });

  it("lets a flick carry the row on to the next place", () => {
    // 20px is nearer closed, but a quick flick toward the end side carries it open.
    expect(release(-20, -1).side).toBe("end");
    expect(release(20, 1).side).toBe("start");
  });

  it("lets a flick back close an open row that was only dragged a little", () => {
    expect(release(-150, 1).side).toBe(null);
  });

  it("ignores speed below the flick threshold", () => {
    expect(release(-20, -0.1).side).toBe(null);
  });

  it("never settles on a side with no actions", () => {
    expect(release(60, 2, endOnly).side).toBe(null);
    expect(release(-60, -2, endOnly).side).toBe("end");
    expect(release(-500, -5, { start: 80, end: 0 }).side).toBe(null);
  });

  it("is not a full swipe unless asked", () => {
    expect(release(-300).full).toBe(false);
    expect(release(-300).side).toBe("end");
  });

  it("runs the first action on a full swipe, only past most of the row's width", () => {
    const limit = 320 * FULL_SWIPE_RATIO;
    expect(release(-limit, 0, both, { fullSwipe: true })).toEqual({ side: "end", full: true });
    expect(release(limit, 0, both, { fullSwipe: true })).toEqual({ side: "start", full: true });
    expect(release(-limit + 1, 0, both, { fullSwipe: true }).full).toBe(false);
  });

  it("does not run a full swipe toward a side with no actions or when the width is unknown", () => {
    expect(release(300, 0, endOnly, { fullSwipe: true }).full).toBe(false);
    expect(release(-300, 0, both, { fullSwipe: true, rowWidth: 0 }).full).toBe(false);
  });
});
