import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef, useRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedBeam, Confetti, GlareHover, Meteors, Particles, SpotlightCard, type ConfettiHandle } from "../src";
import { axeViolations } from "./axe";

function mockMotionPreference(reduce: boolean) {
  vi.stubGlobal("matchMedia", () => ({
    matches: reduce,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

// jsdom has no canvas: hand back a recording 2d context.
function stubCanvas() {
  const calls: string[] = [];
  const ctx = new Proxy(
    {},
    {
      get: (_, name: string) => (name === "canvas" ? undefined : (..._args: unknown[]) => void calls.push(name)),
      set: () => true,
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => ctx) as never);
  return calls;
}

/** jsdom has no PointerEvent: send a pointermove carrying the fields the component reads. */
function movePointer(el: Element, x: number, y: number, pointerType = "mouse") {
  const event = new MouseEvent("pointermove", { bubbles: true, clientX: x, clientY: y });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  act(() => void el.dispatchEvent(event));
}

let frames: FrameRequestCallback[] = [];
const flush = (now: number) => {
  const run = frames;
  frames = [];
  act(() => run.forEach((fn) => fn(now)));
};

beforeEach(() => {
  mockMotionPreference(false);
  frames = [];
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => frames.push(fn));
  vi.stubGlobal("cancelAnimationFrame", () => {
    frames = [];
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function Beam(props: { fromId?: boolean; isPaused?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  return (
    <div ref={container} style={{ position: "relative" }}>
      <div ref={a} id="a">
        One
      </div>
      <div ref={b} id="b">
        Two
      </div>
      {props.fromId ? (
        <AnimatedBeam containerRef={container} fromId="a" toId="b" isPaused={props.isPaused} />
      ) : (
        <AnimatedBeam containerRef={container} fromRef={a} toRef={b} isPaused={props.isPaused} />
      )}
    </div>
  );
}

describe("AnimatedBeam", () => {
  it("draws the line and the moving light on a hidden canvas", () => {
    const calls = stubCanvas();
    const { container } = render(<Beam />);
    const canvas = container.querySelector("canvas")!;
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveClass("rdm-beam");
    expect(container.querySelector("svg")).toBeNull();
    expect(calls).toContain("stroke");
    flush(100);
    flush(200);
    expect(calls.filter((c) => c === "stroke").length).toBeGreaterThan(1);
  });

  it("finds the endpoints by id as well as by ref", () => {
    const calls = stubCanvas();
    render(<Beam fromId />);
    expect(calls).toContain("stroke");
  });

  it("keeps the resting line but does not animate for reduced motion or isPaused", () => {
    stubCanvas();
    mockMotionPreference(true);
    const { container, unmount } = render(<Beam />);
    flush(100);
    expect(frames).toHaveLength(0);
    expect(container.querySelector("canvas")).toBeInTheDocument();
    unmount();
    mockMotionPreference(false);
    const paused = render(<Beam isPaused />);
    flush(100);
    expect(frames).toHaveLength(0);
    expect(paused.container.querySelector("canvas")).toHaveAttribute("data-rdm-paused");
  });

  it("cancels its frame on unmount and has no axe violations", async () => {
    stubCanvas();
    const { container, unmount } = render(<Beam />);
    expect(await axeViolations(container)).toEqual([]);
    unmount();
    expect(frames).toHaveLength(0);
  });

  it("renders on the server without touching the browser", () => {
    expect(() => renderToString(<Beam />)).not.toThrow();
  });
});

describe("SpotlightCard", () => {
  it("renders real content with a hidden glow and sets the position under the pointer", () => {
    render(
      <SpotlightCard data-testid="card">
        <a href="#x">Open</a>
      </SpotlightCard>,
    );
    const card = screen.getByTestId("card");
    expect(screen.getByRole("link", { name: "Open" })).toBeInTheDocument();
    expect(card.querySelector("[aria-hidden='true']")).toHaveClass("rdm-spotlight-glow");
    card.getBoundingClientRect = () => ({ left: 10, top: 20, width: 200, height: 100, right: 210, bottom: 120, x: 10, y: 20, toJSON() {} }) as DOMRect;
    movePointer(card, 60, 50, "mouse");
    expect(card).toHaveAttribute("data-rdm-on");
    expect(card.style.getPropertyValue("--rdm-x")).toBe("50px");
    expect(card.style.getPropertyValue("--rdm-y")).toBe("30px");
    fireEvent.pointerLeave(card);
    expect(card).not.toHaveAttribute("data-rdm-on");
  });

  it("stays off for touch, for reduced motion, inside rdm-still and when paused", () => {
    const { rerender } = render(<SpotlightCard data-testid="card">x</SpotlightCard>);
    const card = screen.getByTestId("card");
    movePointer(card, 5, 5, "touch");
    expect(card).not.toHaveAttribute("data-rdm-on");
    rerender(
      <SpotlightCard data-testid="card" isPaused>
        x
      </SpotlightCard>,
    );
    movePointer(screen.getByTestId("card"), 5, 5, "mouse");
    expect(screen.getByTestId("card")).not.toHaveAttribute("data-rdm-on");
    mockMotionPreference(true);
    rerender(<SpotlightCard data-testid="card">x</SpotlightCard>);
    movePointer(screen.getByTestId("card"), 5, 5, "mouse");
    expect(screen.getByTestId("card")).not.toHaveAttribute("data-rdm-on");
  });

  it("is off inside an rdm-still container", () => {
    mockMotionPreference(false);
    render(
      <div className="rdm-still">
        <SpotlightCard data-testid="card">x</SpotlightCard>
      </div>,
    );
    movePointer(screen.getByTestId("card"), 5, 5, "mouse");
    expect(screen.getByTestId("card")).not.toHaveAttribute("data-rdm-on");
  });

  it("adds no outline rules of its own, so a child keeps its focus ring", () => {
    render(
      <SpotlightCard>
        <button className="focus-visible:ring-2">Go</button>
      </SpotlightCard>,
    );
    const card = screen.getByRole("button").parentElement!.parentElement!;
    expect(card.className).not.toMatch(/outline|ring/);
  });

  it("has no axe violations and renders on the server", async () => {
    const { container } = render(
      <SpotlightCard>
        <h3>Title</h3>
      </SpotlightCard>,
    );
    expect(await axeViolations(container)).toEqual([]);
    expect(renderToString(<SpotlightCard>Hello</SpotlightCard>)).toContain("Hello");
  });
});

describe("GlareHover", () => {
  it("keeps its content readable and adds a hidden band", () => {
    const { container } = render(
      <GlareHover angle={-30} duration={1} isPaused>
        <p>Product</p>
      </GlareHover>,
    );
    expect(screen.getByText("Product")).toBeInTheDocument();
    const root = container.firstElementChild as HTMLElement;
    expect(root.querySelector(".rdm-glare-band")).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveAttribute("data-rdm-paused");
    expect(root.style.getPropertyValue("--rdm-a")).toBe("-30deg");
    expect(root.style.getPropertyValue("--rdm-d")).toBe("1s");
  });

  it("has no axe violations and renders on the server", async () => {
    const { container } = render(
      <GlareHover>
        <img alt="A chart" src="data:," />
      </GlareHover>,
    );
    expect(await axeViolations(container)).toEqual([]);
    expect(renderToString(<GlareHover>Hello</GlareHover>)).toContain("Hello");
  });
});

describe("Meteors", () => {
  it("renders the requested number of hidden streaks, the same on every render", () => {
    const first = renderToString(<Meteors count={5} angle={200} />);
    const second = renderToString(<Meteors count={5} angle={200} />);
    expect(first).toBe(second);
    const { container } = render(<Meteors count={5} angle={200} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll(".rdm-meteor")).toHaveLength(5);
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--rdm-a")).toBe("200deg");
  });

  it("caps the count and pauses", () => {
    const { container } = render(<Meteors count={5000} isPaused />);
    expect(container.querySelectorAll(".rdm-meteor").length).toBeLessThanOrEqual(60);
    expect(container.firstElementChild).toHaveAttribute("data-rdm-paused");
  });

  it("has no axe violations", async () => {
    const { container } = render(<Meteors />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Confetti", () => {
  it("draws a burst from fire() on a canvas that does not block the pointer, then removes itself", () => {
    const calls = stubCanvas();
    const done = vi.fn();
    const ref = createRef<ConfettiHandle>();
    const { container } = render(<Confetti ref={ref} particleCount={10} onComplete={done} />);
    expect(container.querySelector("canvas")).toBeNull();
    act(() => ref.current!.fire());
    const canvas = container.querySelector("canvas")!;
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveClass("rdm-confetti-canvas");
    flush(100);
    flush(200);
    expect(calls).toContain("fillRect");
    // Run well past the longest life: the loop ends and the canvas goes.
    for (let t = 300, n = 0; n < 200 && !done.mock.calls.length; t += 100, n++) flush(t);
    expect(done).toHaveBeenCalledTimes(1);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("fires when isActive turns true", () => {
    stubCanvas();
    const { container, rerender } = render(<Confetti isActive={false} />);
    expect(container.querySelector("canvas")).toBeNull();
    rerender(<Confetti isActive />);
    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("does nothing for reduced motion, isPaused or inside rdm-still", () => {
    stubCanvas();
    mockMotionPreference(true);
    const ref = createRef<ConfettiHandle>();
    const reduced = render(<Confetti ref={ref} />);
    act(() => ref.current!.fire());
    expect(reduced.container.querySelector("canvas")).toBeNull();
    reduced.unmount();

    mockMotionPreference(false);
    const paused = render(<Confetti ref={ref} isPaused />);
    act(() => ref.current!.fire());
    expect(paused.container.querySelector("canvas")).toBeNull();
    paused.unmount();

    const still = render(
      <div className="rdm-still">
        <Confetti ref={ref} />
      </div>,
    );
    act(() => ref.current!.fire());
    expect(still.container.querySelector("canvas")).toBeNull();
  });

  it("stops its frame loop on unmount, has no axe violations and renders on the server", async () => {
    stubCanvas();
    const ref = createRef<ConfettiHandle>();
    const { container, unmount } = render(<Confetti ref={ref} />);
    act(() => ref.current!.fire());
    expect(await axeViolations(container)).toEqual([]);
    unmount();
    expect(frames).toHaveLength(0);
    expect(() => renderToString(<Confetti isActive />)).not.toThrow();
  });
});

describe("Particles", () => {
  it("draws dots on a hidden canvas and keeps drifting", () => {
    const calls = stubCanvas();
    const { container } = render(
      <div>
        <Particles quantity={12} />
      </div>,
    );
    const canvas = container.querySelector("canvas")!;
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveClass("rdm-particles");
    const first = calls.filter((c) => c === "arc").length;
    expect(first).toBeGreaterThanOrEqual(12);
    flush(100);
    flush(200);
    expect(calls.filter((c) => c === "arc").length).toBeGreaterThanOrEqual(first + 24);
  });

  it("draws one still scatter and no loop for reduced motion, isPaused and rdm-still", () => {
    const calls = stubCanvas();
    mockMotionPreference(true);
    const reduced = render(
      <div>
        <Particles quantity={7} />
      </div>,
    );
    const drawn = calls.filter((c) => c === "arc").length;
    expect(drawn).toBeGreaterThanOrEqual(7);
    flush(100);
    expect(calls.filter((c) => c === "arc").length).toBe(drawn);
    expect(frames).toHaveLength(0);
    reduced.unmount();

    mockMotionPreference(false);
    const paused = render(
      <div>
        <Particles quantity={7} isPaused />
      </div>,
    );
    flush(100);
    expect(frames).toHaveLength(0);
    expect(paused.container.querySelector("canvas")).toHaveAttribute("data-rdm-paused");
  });

  it("is paused while off-screen", () => {
    const calls = stubCanvas();
    let notify: (entries: Partial<IntersectionObserverEntry>[]) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (entries: Partial<IntersectionObserverEntry>[]) => void) {
          notify = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    render(
      <div>
        <Particles quantity={5} />
      </div>,
    );
    notify([{ isIntersecting: false }]);
    const before = calls.filter((c) => c === "arc").length;
    flush(100);
    flush(200);
    expect(calls.filter((c) => c === "arc").length).toBe(before);
  });

  it("removes its pointer listeners and cancels its frame on unmount", () => {
    stubCanvas();
    const { container, unmount } = render(
      <div>
        <Particles />
      </div>,
    );
    const host = container.firstElementChild as HTMLElement;
    const remove = vi.spyOn(host, "removeEventListener");
    unmount();
    expect(remove).toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(frames).toHaveLength(0);
  });

  it("has no axe violations and renders on the server", async () => {
    stubCanvas();
    const { container } = render(
      <div>
        <Particles />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
    expect(() => renderToString(<Particles />)).not.toThrow();
  });
});
