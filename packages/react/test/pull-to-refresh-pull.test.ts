import { describe, expect, it } from "vitest";
import { MAX_PULL_RATIO, arrowProgress, isPastThreshold, phaseOf, pullDistance } from "../src/pull-to-refresh/pull";

describe("pullDistance", () => {
  const max = 72 * MAX_PULL_RATIO;

  it("is nothing for no travel or a pull the wrong way", () => {
    expect(pullDistance(0, max)).toBe(0);
    expect(pullDistance(-50, max)).toBe(0);
    expect(pullDistance(100, 0)).toBe(0);
  });

  it("follows the finger at first, but never fully", () => {
    const small = pullDistance(10, max);
    expect(small).toBeGreaterThan(0);
    expect(small).toBeLessThan(10);
    expect(small).toBeGreaterThan(5);
  });

  it("grows with the finger, always more slowly, and never reaches the maximum", () => {
    let last = 0;
    let lastStep = Infinity;
    for (let travel = 20; travel <= 2000; travel += 20) {
      const d = pullDistance(travel, max);
      expect(d).toBeGreaterThan(last);
      expect(d).toBeLessThan(max);
      expect(d - last).toBeLessThanOrEqual(lastStep + 1e-9);
      lastStep = d - last;
      last = d;
    }
  });

  it("reaches the usual threshold with a pull of a hand's width, not a whole screen", () => {
    // A 72px threshold must not need more than about 180px of finger travel, or the gesture is tiring.
    expect(pullDistance(180, max)).toBeGreaterThanOrEqual(72);
    expect(pullDistance(100, max)).toBeLessThan(72);
  });
});

describe("phases", () => {
  it("is past the threshold at the threshold and beyond", () => {
    expect(isPastThreshold(71.9, 72)).toBe(false);
    expect(isPastThreshold(72, 72)).toBe(true);
  });

  it("is idle at rest, pulling short of the threshold, ready past it, and refreshing while loading", () => {
    expect(phaseOf(0, 72, false)).toBe("idle");
    expect(phaseOf(30, 72, false)).toBe("pulling");
    expect(phaseOf(80, 72, false)).toBe("ready");
    expect(phaseOf(0, 72, true)).toBe("refreshing");
    expect(phaseOf(80, 72, true)).toBe("refreshing");
  });

  it("turns the arrow from nothing to the whole way as the threshold is reached", () => {
    expect(arrowProgress(0, 72)).toBe(0);
    expect(arrowProgress(36, 72)).toBe(0.5);
    expect(arrowProgress(72, 72)).toBe(1);
    expect(arrowProgress(200, 72)).toBe(1);
    expect(arrowProgress(-5, 72)).toBe(0);
    expect(arrowProgress(10, 0)).toBe(1);
  });
});
