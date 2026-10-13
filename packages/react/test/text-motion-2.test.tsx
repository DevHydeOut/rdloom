import { act, fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HyperText, KineticText, MorphingText, SpinningText, TextHighlighter } from "../src";
import { axeViolations } from "./axe";

function mockMotionPreference(reduce: boolean) {
  vi.stubGlobal("matchMedia", () => ({
    matches: reduce,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

let observed: ((entries: { isIntersecting: boolean }[]) => void) | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  mockMotionPreference(false);
  observed = null;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        observed = cb;
      }
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const tick = (ms: number, step = 10) => {
  for (let t = 0; t < ms; t += step) act(() => void vi.advanceTimersByTime(step));
};

describe("MorphingText", () => {
  const texts = ["One", "Two", "Three"];

  it("names the group with every phrase and hides the visible layers", () => {
    const { container } = render(<MorphingText texts={texts} />);
    expect(container.firstElementChild?.getAttribute("aria-label")).toBe("One, Two, Three");
    const items = container.querySelectorAll(".rdm-morph-item");
    expect(items).toHaveLength(3);
    items.forEach((item) => expect(item.getAttribute("aria-hidden")).toBe("true"));
    expect(items[0].getAttribute("data-morph")).toBe("in");
  });

  it("morphs to the next phrase after the interval, keeping the old one as the outgoing layer", () => {
    const { container } = render(<MorphingText texts={texts} interval={1000} />);
    tick(1000);
    const items = container.querySelectorAll(".rdm-morph-item");
    expect(items[0].getAttribute("data-morph")).toBe("out");
    expect(items[1].getAttribute("data-morph")).toBe("in");
    expect(container.firstElementChild?.hasAttribute("data-rdm-run")).toBe(true);
  });

  it("holds the first phrase for reduced motion", () => {
    mockMotionPreference(true);
    const { container } = render(<MorphingText texts={texts} interval={500} />);
    tick(2000);
    expect(container.querySelectorAll(".rdm-morph-item")[0].getAttribute("data-morph")).toBe("in");
    expect(container.querySelector("[data-morph='out']")).toBeNull();
  });

  it("stops when paused", () => {
    const { container } = render(<MorphingText texts={texts} interval={500} isPaused />);
    tick(2000);
    expect(container.querySelectorAll(".rdm-morph-item")[0].getAttribute("data-morph")).toBe("in");
    expect(container.firstElementChild?.hasAttribute("data-rdm-paused")).toBe(true);
  });

  it("has the first phrase in the server HTML and passes axe", async () => {
    expect(renderToString(<MorphingText texts={texts} />)).toContain("One");
    const { container } = render(<MorphingText texts={texts} />);
    vi.useRealTimers();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("SpinningText", () => {
  it("gives screen readers the text once and hides the ring", () => {
    const { container } = render(<SpinningText>round</SpinningText>);
    expect(container.querySelector(".sr-only")?.textContent).toBe("round");
    expect(container.querySelector(".rdm-spin-ring")?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelectorAll(".rdm-spin-letter")).toHaveLength(5);
  });

  it("sets the layout variables and the direction", () => {
    const { container } = render(
      <SpinningText radius={50} duration={10} reverse>
        abc
      </SpinningText>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--rdm-r")).toBe("50px");
    expect(root.style.getPropertyValue("--rdm-n")).toBe("3");
    expect(root.style.getPropertyValue("--rdm-d")).toBe("10s");
    expect(container.querySelector(".rdm-spin-ring")?.hasAttribute("data-reverse")).toBe(true);
    expect((container.querySelectorAll(".rdm-spin-letter")[2] as HTMLElement).style.getPropertyValue("--rdm-i")).toBe("2");
  });

  it("marks the paused state, renders on the server, and passes axe", async () => {
    const { container } = render(<SpinningText isPaused>abc</SpinningText>);
    expect(container.firstElementChild?.hasAttribute("data-rdm-paused")).toBe(true);
    expect(renderToString(<SpinningText>abc</SpinningText>)).toContain("abc");
    vi.useRealTimers();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("KineticText", () => {
  it("keeps the full text for screen readers and indexes every letter", () => {
    const { container } = render(<KineticText>Hi you</KineticText>);
    expect(container.querySelector(".sr-only")?.textContent).toBe("Hi you");
    const units = container.querySelectorAll(".rdm-kinetic-unit");
    expect(units).toHaveLength(5);
    expect((units[4] as HTMLElement).style.getPropertyValue("--rdm-i")).toBe("4");
  });

  it("sets the effect, speed and pause state", () => {
    const { container } = render(
      <KineticText effect="bounce" duration={2} stagger={0.2} isPaused>
        Hey
      </KineticText>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-effect")).toBe("bounce");
    expect(root.style.getPropertyValue("--rdm-d")).toBe("2s");
    expect(root.style.getPropertyValue("--rdm-s")).toBe("0.2s");
    expect(root.hasAttribute("data-rdm-paused")).toBe(true);
  });

  it("renders on the server and passes axe", async () => {
    expect(renderToString(<KineticText>Hello</KineticText>)).toContain("Hello");
    const { container } = render(<KineticText>Hello</KineticText>);
    vi.useRealTimers();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("TextHighlighter", () => {
  it("keeps the text as ordinary text and shows the finished marker in the server HTML", () => {
    const html = renderToString(<TextHighlighter>Marked</TextHighlighter>);
    expect(html).toContain("Marked");
    expect(html).toContain('data-rdm-anim="idle"');
  });

  it("waits, then sweeps when scrolled into view", () => {
    const { container } = render(<TextHighlighter>Marked</TextHighlighter>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-rdm-anim")).toBe("wait");
    act(() => observed?.([{ isIntersecting: true }]));
    expect(root.getAttribute("data-rdm-anim")).toBe("run");
  });

  it("sweeps at once when whenInView is off, and takes a colour", () => {
    const { container } = render(
      <TextHighlighter whenInView={false} color="red">
        Marked
      </TextHighlighter>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-rdm-anim")).toBe("run");
    expect(root.style.getPropertyValue("--rdm-c")).toBe("red");
  });

  it("stays drawn for reduced motion and when paused", () => {
    mockMotionPreference(true);
    const reduced = render(<TextHighlighter>A</TextHighlighter>);
    expect(reduced.container.firstElementChild?.getAttribute("data-rdm-anim")).toBe("idle");
    reduced.unmount();
    mockMotionPreference(false);
    const paused = render(<TextHighlighter isPaused>B</TextHighlighter>);
    expect(paused.container.firstElementChild?.getAttribute("data-rdm-anim")).toBe("idle");
    expect(paused.container.firstElementChild?.hasAttribute("data-rdm-paused")).toBe(true);
  });

  it("passes axe", async () => {
    const { container } = render(<TextHighlighter>Marked</TextHighlighter>);
    vi.useRealTimers();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("HyperText", () => {
  const visible = (container: HTMLElement) => container.querySelector("[aria-hidden='true']")?.textContent ?? "";

  it("has the final text in the server HTML and for screen readers", () => {
    expect(renderToString(<HyperText>Decode</HyperText>)).toContain("Decode");
    const { container } = render(<HyperText whenInView={false}>Decode</HyperText>);
    expect(container.querySelector(".sr-only")?.textContent).toBe("Decode");
    expect(visible(container)).toBe("Decode");
  });

  it("scrambles on hover, keeps spaces, then settles on the real text", () => {
    const { container } = render(
      <HyperText whenInView={false} duration={500}>
        Ab Cd
      </HyperText>,
    );
    fireEvent.pointerEnter(container.firstElementChild as Element);
    tick(50, 50);
    const mid = visible(container);
    expect(mid).toHaveLength(5);
    expect(mid[2]).toBe(" ");
    tick(600, 50);
    expect(visible(container)).toBe("Ab Cd");
    expect(container.querySelector(".sr-only")?.textContent).toBe("Ab Cd");
  });

  it("scrambles once when it scrolls into view", () => {
    const { container } = render(<HyperText duration={500}>Hello</HyperText>);
    act(() => observed?.([{ isIntersecting: true }]));
    tick(50, 50);
    expect(visible(container)).toHaveLength(5);
    tick(600, 50);
    expect(visible(container)).toBe("Hello");
  });

  it("never scrambles for reduced motion, when paused, or when hover is off", () => {
    mockMotionPreference(true);
    const reduced = render(<HyperText whenInView={false}>Hello</HyperText>);
    fireEvent.pointerEnter(reduced.container.firstElementChild as Element);
    tick(100, 50);
    expect(visible(reduced.container)).toBe("Hello");
    reduced.unmount();
    mockMotionPreference(false);
    const paused = render(
      <HyperText isPaused whenInView={false}>
        Hello
      </HyperText>,
    );
    fireEvent.pointerEnter(paused.container.firstElementChild as Element);
    tick(100, 50);
    expect(visible(paused.container)).toBe("Hello");
    paused.unmount();
    const off = render(
      <HyperText onHover={false} whenInView={false}>
        Hello
      </HyperText>,
    );
    fireEvent.pointerEnter(off.container.firstElementChild as Element);
    tick(100, 50);
    expect(visible(off.container)).toBe("Hello");
  });

  it("passes axe", async () => {
    const { container } = render(<HyperText>Decode</HyperText>);
    vi.useRealTimers();
    expect(await axeViolations(container)).toEqual([]);
  });
});
