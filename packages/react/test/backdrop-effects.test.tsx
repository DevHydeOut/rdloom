import fs from "node:fs";
import path from "node:path";
import { act, render } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FlickeringGrid, LightRays, Noise, RetroGrid, ScrollProgress, WeaveGrid } from "../src";
import { axeViolations } from "./axe";

const css = fs.readFileSync(path.join(__dirname, "..", "src", "motion", "rdloom-motion.css"), "utf8");

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const decor = [
  ["RetroGrid", RetroGrid, "rdm-retro"],
  ["LightRays", LightRays, "rdm-rays-root"],
  ["Noise", Noise, "rdm-noise"],
  ["WeaveGrid", WeaveGrid, "rdm-weave"],
] as const;

describe.each(decor)("%s", (_n, Effect, cls) => {
  it("is hidden decoration that ignores the pointer", () => {
    const { container } = render(<Effect />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el.className).toContain("rdm-pattern");
    expect(el.className).toContain(cls);
    expect(css).toMatch(/\.rdm-pattern \{[^}]*pointer-events: none/);
    expect(css).toMatch(/forced-colors: active\)\s*\{\s*\.rdm-pattern \{\s*display: none/);
  });

  it("isStill marks the layer, and the stylesheet only animates it when not still", () => {
    const { container } = render(<Effect isStill />);
    expect(container.firstElementChild).toHaveAttribute("data-rdm-still");
    expect(css).toMatch(new RegExp(`\\.${cls}(\\[data-animated\\])?:not\\(\\[data-rdm-still\\]\\)`));
  });

  it("forwards the ref and className, and renders in server HTML", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<Effect ref={ref} className="extra" />);
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current).toHaveClass("extra");
    expect(renderToString(<Effect />)).toContain(cls);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <div>
        <Effect />
        <p>Content on top</p>
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("effect details", () => {
  it("RetroGrid takes angle, cell size, colour and duration as variables", () => {
    const { container } = render(<RetroGrid angle={70} cellSize={48} color="tomato" duration={20} />);
    const s = (container.firstElementChild as HTMLElement).style;
    expect(s.getPropertyValue("--rdm-ang")).toBe("70deg");
    expect(s.getPropertyValue("--rdm-p")).toBe("48px");
    expect(s.getPropertyValue("--rdm-pc")).toBe("tomato");
    expect(s.getPropertyValue("--rdm-d")).toBe("20s");
  });

  it("LightRays takes colour and angle", () => {
    const { container } = render(<LightRays color="gold" angle={35} />);
    const s = (container.firstElementChild as HTMLElement).style;
    expect(s.getPropertyValue("--rdm-pc")).toBe("gold");
    expect(s.getPropertyValue("--rdm-ang")).toBe("35deg");
  });

  it("Noise is still by default, takes opacity and only moves when asked", () => {
    const { container, rerender } = render(<Noise opacity={0.2} />);
    const el = () => container.firstElementChild as HTMLElement;
    expect(el().style.getPropertyValue("--rdm-op")).toBe("0.2");
    expect(el()).not.toHaveAttribute("data-animated");
    rerender(<Noise animated />);
    expect(el()).toHaveAttribute("data-animated");
    // The shift is four steps over four seconds: one change a second, under the 3 a second limit.
    expect(css).toMatch(/animation: rdm-noise-shift var\(--rdm-d, 4s\) steps\(4/);
  });

  it("WeaveGrid draws warp, weft and a shuttle and defaults the accent to the ember token", () => {
    const { container } = render(<WeaveGrid />);
    for (const c of ["rdm-weave-warp", "rdm-weave-weft", "rdm-weave-shuttle"]) expect(container.querySelector(`.${c}`)).not.toBeNull();
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--rdm-ac")).toBe("var(--rd-color-ember-500)");
    expect(css).toMatch(/\.rdm-weave:not\(\[data-rdm-still\]\) \.rdm-weave-shuttle \{\s*animation: rdm-weave-pass/);
  });

  it("the stylesheet stills every backdrop for reduced motion and rdm-still", () => {
    for (const c of ["rdm-retro-grid", "rdm-rays", "rdm-noise", "rdm-weave-shuttle", "rdm-sprogress-bar"]) {
      expect(css).toContain(`.rdm-still .${c}`);
    }
  });
});

describe("FlickeringGrid", () => {
  const calls: string[] = [];
  const ctx = {
    clearRect: () => calls.push("clear"),
    fillRect: () => calls.push("rect"),
    set fillStyle(_v: string) {},
    set globalAlpha(_v: number) {},
  };
  beforeEach(() => {
    calls.length = 0;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 100 });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => 50 });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight;
  });

  it("is a hidden canvas decoration", () => {
    const { container } = render(<FlickeringGrid />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe("CANVAS");
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el.className).toContain("rdm-pattern");
  });

  it("draws a grid of squares", () => {
    render(<FlickeringGrid squareSize={4} gridGap={6} />);
    // 100 x 50 at a 10px pitch is 10 x 5 squares.
    expect(calls.filter((c) => c === "rect")).toHaveLength(50);
  });

  it("picks new brightness no more than 3 times a second", () => {
    const src = fs.readFileSync(path.join(__dirname, "..", "src", "flickering-grid", "flickering-grid.tsx"), "utf8");
    const tick = Number(/const TICK = (\d+)/.exec(src)![1]);
    expect(1000 / tick).toBeLessThanOrEqual(3);
  });

  it("draws one still frame and runs no timers with isStill", () => {
    vi.useFakeTimers();
    const raf = vi.spyOn(window, "requestAnimationFrame");
    const { container } = render(<FlickeringGrid isStill />);
    expect(container.firstElementChild).toHaveAttribute("data-rdm-still");
    const drawn = calls.length;
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(calls.length).toBe(drawn);
    expect(raf).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stands still for reduced motion", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }));
    const { container } = render(<FlickeringGrid />);
    expect(container.firstElementChild).toHaveAttribute("data-rdm-still");
  });

  it("stops its timers when it unmounts", () => {
    vi.useFakeTimers();
    const { unmount } = render(<FlickeringGrid />);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("renders in server HTML and has no axe violations", async () => {
    expect(renderToString(<FlickeringGrid />)).toContain("<canvas");
    const { container } = render(<FlickeringGrid />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("ScrollProgress", () => {
  const scrollTo = (el: HTMLElement, top: number) => {
    el.scrollTop = top;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
      vi.advanceTimersByTime(300);
    });
  };
  const scroller = () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollHeight", { value: 1000, configurable: true });
    Object.defineProperty(el, "clientHeight", { value: 200, configurable: true });
    return el;
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("is a progressbar with a name and a range, and renders in server HTML", () => {
    const { getByRole } = render(<ScrollProgress />);
    const bar = getByRole("progressbar", { name: "Reading progress" });
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(renderToString(<ScrollProgress />)).toContain('role="progressbar"');
  });

  it("follows a target container and updates aria-valuenow", () => {
    const el = scroller();
    const ref = { current: el };
    const { getByRole, container } = render(<ScrollProgress target={ref} />);
    const bar = getByRole("progressbar");
    scrollTo(el, 400);
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect((container.querySelector(".rdm-sprogress-bar") as HTMLElement).style.width).toBe("50%");
    scrollTo(el, 800);
    expect(bar).toHaveAttribute("aria-valuenow", "100");
  });

  it("throttles the spoken value while scrolling quickly", () => {
    const el = scroller();
    const { getByRole } = render(<ScrollProgress target={{ current: el }} />);
    const bar = getByRole("progressbar");
    const writes: string[] = [];
    const set = bar.setAttribute.bind(bar);
    bar.setAttribute = (n: string, v: string) => {
      if (n === "aria-valuenow") writes.push(v);
      set(n, v);
    };
    for (let i = 1; i <= 10; i++) {
      el.scrollTop = i * 40;
      act(() => {
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(20);
      });
    }
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(writes.length).toBeLessThan(5);
    expect(bar).toHaveAttribute("aria-valuenow", "50");
  });

  it("tracks the page when no target is given and clamps to 0 when nothing scrolls", () => {
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 2000, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 1000, configurable: true });
    const { getByRole } = render(<ScrollProgress position="bottom" />);
    const bar = getByRole("progressbar");
    expect(bar).toHaveAttribute("data-position", "bottom");
    Object.defineProperty(window, "scrollY", { value: 500, configurable: true });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      vi.advanceTimersByTime(300);
    });
    expect(bar).toHaveAttribute("aria-valuenow", "50");
  });

  it("is real content: never hidden decoration, never in forced-colors removal, and instant for reduced motion", () => {
    const { getByRole } = render(<ScrollProgress />);
    expect(getByRole("progressbar")).not.toHaveAttribute("aria-hidden");
    expect(css).toMatch(/\.rdm-sprogress \{[^}]*pointer-events: none/);
    expect(css).toMatch(/forced-colors: active\)\s*\{\s*\.rdm-sprogress-bar \{\s*forced-color-adjust: none;\s*background: Highlight/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*\.rdm-sprogress-bar \{\s*transition: none/);
  });

  it("removes its listeners on unmount and has no axe violations", async () => {
    vi.useRealTimers();
    const el = scroller();
    const off = vi.spyOn(el, "removeEventListener");
    const { unmount, container } = render(<ScrollProgress target={{ current: el }} />);
    expect(await axeViolations(container)).toEqual([]);
    unmount();
    expect(off).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
