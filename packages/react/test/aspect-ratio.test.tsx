import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AspectRatio } from "../src";
import { axeViolations } from "./axe";

const ratioOf = (el: HTMLElement) => el.style.aspectRatio;

describe("AspectRatio", () => {
  it("defaults to 16 / 9, clips overflow and has no axe violations", async () => {
    const { container } = render(<AspectRatio>content</AspectRatio>);
    const root = container.firstElementChild as HTMLElement;
    expect(ratioOf(root)).toBe("16 / 9");
    expect(root.className).toContain("overflow-hidden");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("accepts presets, numbers and w/h strings", () => {
    const cases: Array<[Parameters<typeof AspectRatio>[0]["ratio"], string]> = [
      ["square", "1 / 1"],
      ["photo", "3 / 2"],
      ["wide", "21 / 9"],
      ["portrait", "3 / 4"],
      [1.5, "1.5"],
      ["4/3", "4 / 3"],
    ];
    for (const [ratio, css] of cases) {
      const { container, unmount } = render(<AspectRatio ratio={ratio} />);
      expect(ratioOf(container.firstElementChild as HTMLElement)).toBe(css);
      unmount();
    }
  });

  it("rounds only when asked", () => {
    const { container, rerender } = render(<AspectRatio />);
    expect((container.firstElementChild as HTMLElement).className).not.toContain("rounded");
    rerender(<AspectRatio rounded />);
    expect((container.firstElementChild as HTMLElement).className).toContain("rounded-[var(--rd-radius-control)]");
  });
});
