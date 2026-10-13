import fs from "node:fs";
import path from "node:path";
import { act, fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DotPattern, GridPattern, HexagonPattern, InteractiveGridPattern, StripedPattern } from "../src";
import { axeViolations } from "./axe";

const css = fs.readFileSync(path.join(__dirname, "..", "src", "motion", "rdloom-motion.css"), "utf8");

afterEach(() => vi.unstubAllGlobals());

const all = [
  ["GridPattern", GridPattern],
  ["DotPattern", DotPattern],
  ["StripedPattern", StripedPattern],
  ["HexagonPattern", HexagonPattern],
] as const;

describe.each(all)("%s", (_name, Pattern) => {
  it("is hidden decoration", () => {
    const { container } = render(<Pattern data-testid="p" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el.className).toContain("rdm-pattern");
    expect(css).toMatch(/\.rdm-pattern \{[^}]*pointer-events: none/);
  });

  it("takes a colour token and an edge fade", () => {
    const { container } = render(<Pattern color="var(--rd-color-border-strong)" fade />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.getPropertyValue("--rdm-pc")).toBe("var(--rd-color-border-strong)");
    expect(el).toHaveAttribute("data-fade", "edge");
  });

  it("animates only when asked, and isStill stops it", () => {
    const { container, rerender } = render(<Pattern />);
    const el = () => container.firstElementChild as HTMLElement;
    expect(el()).not.toHaveAttribute("data-animated");
    rerender(<Pattern animated />);
    expect(el()).toHaveAttribute("data-animated");
    rerender(<Pattern animated isStill />);
    expect(el()).toHaveAttribute("data-rdm-still");
    expect(css).toContain(".rdm-pattern[data-animated]:not([data-rdm-still]) .rdm-pattern-fill");
  });

  it("renders in server HTML and has no axe violations", async () => {
    expect(renderToString(<Pattern />)).toContain("rdm-pattern");
    const { container } = render(<Pattern animated />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("pattern shapes", () => {
  const fill = (c: HTMLElement) => c.querySelector<HTMLElement>(".rdm-pattern-fill")!;
  it("grid uses size and strokeWidth", () => {
    const { container } = render(<GridPattern size={40} strokeWidth={2} />);
    expect(fill(container).style.backgroundSize).toBe("40px 40px");
    expect(fill(container).style.backgroundImage).toContain("2px");
  });
  it("dot spaces dots by size plus gap", () => {
    const { container } = render(<DotPattern size={2} gap={18} />);
    expect(fill(container).style.backgroundSize).toBe("20px 20px");
  });
  it("stripes follow the angle", () => {
    const { container } = render(<StripedPattern angle={30} size={2} gap={8} />);
    expect(fill(container).style.backgroundImage).toContain("30deg");
  });
  it("hexagon is a mask with the colour as background and no markup in the DOM", () => {
    const { container } = render(<HexagonPattern size={20} strokeWidth={2} />);
    expect(fill(container).style.backgroundColor).toBe("var(--rdm-pc)");
    expect(decodeURIComponent(fill(container).style.maskImage || fill(container).style.getPropertyValue("-webkit-mask-image") || "")).toContain("stroke-width='2'");
    expect(container.querySelector("svg")).toBeNull();
  });
});

describe("reduced motion and forced colors", () => {
  it("the stylesheet stills drift for reduced motion and rdm-still, and hides the layer in forced colors", () => {
    expect(css).toMatch(/\.rdm-pattern-fill \{\s*animation: none !important/);
    expect(css).toContain(".rdm-still .rdm-pattern-fill");
    expect(css).toMatch(/forced-colors: active\)\s*\{\s*\.rdm-pattern \{\s*display: none/);
  });
});

describe("InteractiveGridPattern", () => {
  const setup = (props = {}) => {
    const utils = render(
      <div data-testid="host">
        <InteractiveGridPattern size={40} {...props} />
      </div>,
    );
    const host = utils.getByTestId("host");
    const grid = host.firstElementChild as HTMLElement;
    grid.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400, right: 400, bottom: 400, x: 0, y: 0, toJSON() {} }) as DOMRect;
    return { ...utils, host, grid };
  };
  const move = (host: HTMLElement, x: number, y: number, pointerType = "mouse") =>
    act(() => {
      const e = new Event("pointermove", { bubbles: true }) as Event & Record<string, unknown>;
      Object.assign(e, { clientX: x, clientY: y, pointerType });
      host.dispatchEvent(e);
    });

  it("is decoration and lights the cell under the pointer", () => {
    const { host, grid } = setup();
    expect(grid).toHaveAttribute("aria-hidden", "true");
    move(host, 85, 45);
    const cell = grid.querySelector<HTMLElement>(".rdm-igrid-cell")!;
    expect(cell.style.top).toBe("40px");
    expect(cell.style.insetInlineStart).toBe("80px");
  });

  it("fill keeps one cell, trail keeps several", () => {
    const a = setup();
    move(a.host, 5, 5);
    move(a.host, 45, 5);
    expect(a.grid.querySelectorAll(".rdm-igrid-cell")).toHaveLength(1);
    a.unmount();
    const b = setup({ variant: "trail" });
    move(b.host, 5, 5);
    move(b.host, 45, 5);
    expect(b.grid.querySelectorAll(".rdm-igrid-cell")).toHaveLength(2);
    fireEvent.animationEnd(b.grid.querySelector(".rdm-igrid-cell")!);
    expect(b.grid.querySelectorAll(".rdm-igrid-cell")).toHaveLength(1);
  });

  it("ignores touch", () => {
    const { host, grid } = setup();
    move(host, 5, 5, "touch");
    expect(grid.querySelectorAll(".rdm-igrid-cell")).toHaveLength(0);
  });

  it("does nothing with isStill or reduced motion", () => {
    const s = setup({ isStill: true });
    move(s.host, 5, 5);
    expect(s.grid.querySelectorAll(".rdm-igrid-cell")).toHaveLength(0);
    s.unmount();
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }));
    const r = setup();
    move(r.host, 5, 5);
    expect(r.grid.querySelectorAll(".rdm-igrid-cell")).toHaveLength(0);
  });

  it("never takes focus or the pointer, and has no axe violations", async () => {
    const { container, grid } = setup();
    expect(grid.querySelector("[tabindex],button,a")).toBeNull();
    expect(css).toMatch(/\.rdm-pattern \{[^}]*pointer-events: none/);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders in server HTML", () => {
    expect(renderToString(<InteractiveGridPattern />)).toContain("rdm-igrid");
  });
});
