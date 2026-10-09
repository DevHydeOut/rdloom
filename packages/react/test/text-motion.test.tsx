import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TextAnimate, TextReveal, TypingAnimation, WordRotate } from "../src";
import { axeViolations } from "./axe";

function mockMotionPreference(reduce: boolean) {
  vi.stubGlobal("matchMedia", () => ({
    matches: reduce,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => {
  vi.useFakeTimers();
  mockMotionPreference(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Advance time in small steps: each step lets React schedule the next timer. */
const tick = (ms: number, step = 10) => {
  for (let t = 0; t < ms; t += step) act(() => void vi.advanceTimersByTime(step));
};

const visibleCopy = (container: HTMLElement) => container.querySelector("[aria-hidden='true']")?.textContent;

describe("TypingAnimation", () => {
  it("keeps the full text for screen readers while the visible copy types", () => {
    const { container } = render(<TypingAnimation speed={50}>Hello</TypingAnimation>);
    expect(container.querySelector(".sr-only")?.textContent).toBe("Hello");
    expect(visibleCopy(container)).toBe("");
    tick(50 * 3, 50);
    expect(visibleCopy(container)).toBe("Hel");
    tick(50 * 5, 50);
    expect(visibleCopy(container)).toBe("Hello");
  });

  it("shows the finished text for reduced motion", () => {
    mockMotionPreference(true);
    const { container } = render(<TypingAnimation>Hello</TypingAnimation>);
    expect(visibleCopy(container)).toBe("Hello");
  });

  it("shows the finished text when paused", () => {
    const { container } = render(<TypingAnimation isPaused>Hello</TypingAnimation>);
    expect(visibleCopy(container)).toBe("Hello");
    expect(container.firstElementChild?.hasAttribute("data-rdm-paused")).toBe(true);
  });

  it("types again when it loops", () => {
    const { container } = render(
      <TypingAnimation loop speed={10}>
        Hi
      </TypingAnimation>,
    );
    tick(30);
    expect(visibleCopy(container)).toBe("Hi");
    let restarted = false;
    for (let t = 0; t < 1800; t += 10) {
      act(() => void vi.advanceTimersByTime(10));
      if ((visibleCopy(container)?.length ?? 2) < 2) restarted = true;
    }
    expect(restarted).toBe(true);
  });

  it("can drop the cursor", () => {
    const { container } = render(<TypingAnimation cursor={false}>Hello</TypingAnimation>);
    expect(container.querySelector(".rdm-caret")).toBeNull();
  });

  it("renders the full text on the server", () => {
    const html = renderToString(<TypingAnimation>Server text</TypingAnimation>);
    expect(html.match(/Server text/g)?.length).toBe(2);
  });

  it("has no accessibility violations", async () => {
    vi.useRealTimers();
    const { container } = render(<TypingAnimation>Hello</TypingAnimation>);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("WordRotate", () => {
  const words = ["teams", "makers", "studios"];

  it("names the slot with all the words and hides the visible one", () => {
    render(<WordRotate words={words} />);
    const group = screen.getByRole("group", { name: "teams, makers, studios" });
    expect(group.querySelector("[data-current]")?.textContent).toBe("teams");
    expect(group.querySelector("[data-current]")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("accepts a custom label", () => {
    render(<WordRotate words={words} label="Who it is for" />);
    expect(screen.getByRole("group", { name: "Who it is for" })).toBeTruthy();
  });

  it("cycles through the words and loops", () => {
    const { container } = render(<WordRotate words={words} duration={1000} />);
    const current = () => container.querySelector("[data-current]")?.textContent;
    expect(current()).toBe("teams");
    tick(1000, 1000);
    expect(current()).toBe("makers");
    tick(2000, 500);
    expect(current()).toBe("teams");
  });

  it("announces politely only when asked", () => {
    const { container } = render(<WordRotate words={words} announce />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(container.querySelector("[data-current]")?.getAttribute("aria-hidden")).toBeNull();
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("stops when paused and for reduced motion", () => {
    const paused = render(<WordRotate words={words} duration={500} isPaused />);
    tick(2000, 500);
    expect(paused.container.querySelector("[data-current]")?.textContent).toBe("teams");
    paused.unmount();
    mockMotionPreference(true);
    const reduced = render(<WordRotate words={words} duration={500} />);
    tick(2000, 500);
    expect(reduced.container.querySelector("[data-current]")?.textContent).toBe("teams");
  });

  it("renders on the server with the first word showing", () => {
    const html = renderToString(<WordRotate words={words} />);
    expect(html).toContain("data-current");
    expect(html).toContain("teams");
  });

  it("has no accessibility violations", async () => {
    vi.useRealTimers();
    const quiet = render(<WordRotate words={words} />);
    expect(await axeViolations(quiet.container)).toEqual([]);
    quiet.unmount();
    const loud = render(<WordRotate words={words} announce />);
    expect(await axeViolations(loud.container)).toEqual([]);
  });
});

describe("TextReveal", () => {
  it("keeps the real text in the DOM", () => {
    render(<TextReveal>The quick brown fox</TextReveal>);
    expect(screen.getByText(/The/).closest("p")?.textContent).toBe("The quick brown fox");
  });

  it("fades the words in step with scroll progress", () => {
    const { container } = render(<TextReveal minOpacity={0.2}>one two three four</TextReveal>);
    const units = [...container.querySelectorAll<HTMLElement>(".rdm-reveal-unit")];
    expect(units).toHaveLength(4);
    // jsdom reports no layout, so the passage counts as fully above the fold.
    expect(Number(units[0].style.opacity)).toBeGreaterThanOrEqual(0.2);
    expect(Number(units[3].style.opacity)).toBeLessThanOrEqual(1);
  });

  it("shows everything at full strength for reduced motion and when paused", () => {
    mockMotionPreference(true);
    const reduced = render(<TextReveal>one two</TextReveal>);
    for (const el of reduced.container.querySelectorAll<HTMLElement>(".rdm-reveal-unit")) expect(el.style.opacity).toBe("");
    reduced.unmount();
    mockMotionPreference(false);
    const paused = render(<TextReveal isPaused>one two</TextReveal>);
    for (const el of paused.container.querySelectorAll<HTMLElement>(".rdm-reveal-unit")) expect(el.style.opacity).toBe("");
  });

  it("reveals by line", () => {
    const { container } = render(<TextReveal by="line">{"first line\nsecond line"}</TextReveal>);
    expect(container.querySelectorAll(".rdm-reveal-unit")).toHaveLength(2);
    expect(container.querySelector("br")).toBeTruthy();
  });

  it("view mode reveals when it scrolls into view", () => {
    let callback: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { container } = render(<TextReveal mode="view">one two</TextReveal>);
    const first = () => container.querySelector<HTMLElement>(".rdm-reveal-unit")!;
    expect(first().style.opacity).toBe("0.2");
    act(() => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(first().style.opacity).toBe("1");
  });

  it("renders the full text on the server", () => {
    expect(renderToString(<TextReveal>Server words here</TextReveal>)).toContain("Server");
  });

  it("has no accessibility violations", async () => {
    vi.useRealTimers();
    const { container } = render(<TextReveal>The quick brown fox</TextReveal>);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("TextAnimate", () => {
  it("gives screen readers the full text once and hides the animated copy", () => {
    const { container } = render(<TextAnimate by="character">Hi you</TextAnimate>);
    expect(container.querySelector(".sr-only")?.textContent).toBe("Hi you");
    expect(container.querySelector("[aria-hidden='true']")?.textContent).toBe("Hi you");
  });

  it("splits by character, word and line", () => {
    const chars = render(<TextAnimate by="character">ab cd</TextAnimate>);
    expect(chars.container.querySelectorAll(".rdm-unit")).toHaveLength(4);
    chars.unmount();
    const words = render(<TextAnimate by="word">one two three</TextAnimate>);
    expect(words.container.querySelectorAll(".rdm-unit")).toHaveLength(3);
    words.unmount();
    const lines = render(<TextAnimate by="line">{"a\nb"}</TextAnimate>);
    expect(lines.container.querySelectorAll(".rdm-unit")).toHaveLength(2);
  });

  it("applies the preset class and timing variables", () => {
    const { container } = render(
      <TextAnimate animation="blurIn" delay={0.3} duration={1} stagger={0.1}>
        Hello
      </TextAnimate>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("rdm-ta-blurIn");
    expect(root.style.getPropertyValue("--rdm-delay")).toBe("0.3s");
    expect(root.style.getPropertyValue("--rdm-d")).toBe("1s");
    expect(root.style.getPropertyValue("--rdm-s")).toBe("0.1s");
  });

  it("starts running after mount", () => {
    const { container } = render(<TextAnimate>Hello</TextAnimate>);
    expect(container.firstElementChild?.getAttribute("data-rdm-anim")).toBe("run");
  });

  it("stays idle for reduced motion and when paused", () => {
    mockMotionPreference(true);
    const reduced = render(<TextAnimate>Hello</TextAnimate>);
    expect(reduced.container.firstElementChild?.getAttribute("data-rdm-anim")).toBe("idle");
    reduced.unmount();
    mockMotionPreference(false);
    const paused = render(<TextAnimate isPaused>Hello</TextAnimate>);
    expect(paused.container.firstElementChild?.getAttribute("data-rdm-anim")).toBe("idle");
  });

  it("waits to be seen when whenInView is set", () => {
    let callback: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { container } = render(<TextAnimate whenInView>Hello</TextAnimate>);
    expect(container.firstElementChild?.getAttribute("data-rdm-anim")).toBe("wait");
    act(() => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(container.firstElementChild?.getAttribute("data-rdm-anim")).toBe("run");
  });

  it("renders visible text on the server", () => {
    const html = renderToString(<TextAnimate>Server text</TextAnimate>);
    expect(html).toContain("data-rdm-anim=\"idle\"");
    expect(html).toContain("Server text");
  });

  it("has no accessibility violations", async () => {
    vi.useRealTimers();
    const { container } = render(<TextAnimate by="character">Hello</TextAnimate>);
    expect(await axeViolations(container)).toEqual([]);
  });
});
