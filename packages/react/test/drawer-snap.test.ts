import { describe, expect, it } from "vitest";
import { clampIndex, cleanSnapPoints, dragHeight, resolveSnap, snapHeights, stepIndex } from "../src/drawer/snap";

describe("cleanSnapPoints", () => {
  it("sorts, removes repeats and keeps points inside 0.1 to 1", () => {
    expect(cleanSnapPoints([0.9, 0.4, 0.4, 2, 0.01])).toEqual([0.1, 0.4, 0.9, 1]);
  });

  it("drops anything that is not a number", () => {
    expect(cleanSnapPoints([0.5, Number.NaN, Infinity, -Infinity])).toEqual([0.5]);
  });

  it("is empty for nothing", () => {
    expect(cleanSnapPoints(undefined)).toEqual([]);
    expect(cleanSnapPoints([])).toEqual([]);
  });
});

describe("heights and indexes", () => {
  it("turns shares into pixels of the space", () => {
    expect(snapHeights([0.4, 0.9], 1000)).toEqual([400, 900]);
    expect(snapHeights([0.333], 100)).toEqual([33]);
  });

  it("keeps an index inside the list", () => {
    expect(clampIndex(-3, 3)).toBe(0);
    expect(clampIndex(7, 3)).toBe(2);
    expect(clampIndex(1.4, 3)).toBe(1);
    expect(clampIndex(5, 0)).toBe(0);
  });

  it("steps up and down without leaving the list", () => {
    expect(stepIndex(0, 3, 1)).toBe(1);
    expect(stepIndex(2, 3, 1)).toBe(2);
    expect(stepIndex(0, 3, -1)).toBe(0);
    expect(stepIndex(2, 3, -1)).toBe(1);
  });
});

describe("dragHeight", () => {
  const heights = [300, 600];

  it("follows the finger between the points", () => {
    expect(dragHeight(300, 120, heights, true)).toBe(420);
    expect(dragHeight(600, -200, heights, true)).toBe(400);
  });

  it("stretches a little past the tallest point and never far", () => {
    const over = dragHeight(600, 60, heights, true);
    expect(over).toBeGreaterThan(600);
    expect(over).toBeLessThan(660);
    expect(dragHeight(600, 5000, heights, true)).toBeLessThan(600 + 9);
  });

  it("follows the finger below the lowest point when it can be dismissed, down to nothing", () => {
    expect(dragHeight(300, -120, heights, true)).toBe(180);
    expect(dragHeight(300, -900, heights, true)).toBe(0);
  });

  it("stops at the lowest point when it cannot be dismissed", () => {
    expect(dragHeight(300, -120, heights, false)).toBe(300);
  });
});

describe("resolveSnap", () => {
  const heights = [300, 600, 900];
  const settle = (height: number, velocity = 0, dismissable = true) => resolveSnap({ height, velocity, heights, dismissable }).index;

  it("settles on the nearest point when let go slowly", () => {
    expect(settle(310)).toBe(0);
    expect(settle(460)).toBe(1);
    expect(settle(760)).toBe(2);
    expect(settle(900)).toBe(2);
  });

  it("lets a flick carry the sheet to the next point", () => {
    // 380 is nearer the lowest point, but a quick flick up carries it on to the middle one.
    expect(settle(380, 1)).toBe(1);
    expect(settle(520, -1)).toBe(0);
  });

  it("ignores speed below the flick threshold", () => {
    expect(settle(380, 0.1)).toBe(0);
  });

  it("closes when it ends well below the lowest point, if it can be dismissed", () => {
    expect(settle(120)).toBeNull();
    expect(settle(170)).toBe(0);
    expect(settle(120, 0, false)).toBe(0);
  });

  it("closes on a quick flick down from the lowest point", () => {
    expect(settle(280, -1)).toBeNull();
  });

  it("settles on the only point there is", () => {
    expect(resolveSnap({ height: 500, velocity: 0, heights: [400], dismissable: true }).index).toBe(0);
    expect(resolveSnap({ height: 500, velocity: 0, heights: [], dismissable: true }).index).toBe(0);
  });
});
