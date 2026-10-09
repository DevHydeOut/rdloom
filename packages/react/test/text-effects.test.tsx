import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuroraText, ComicText, LineShadowText, ScrollVelocity, SparklesText, Text3dFlip, VideoText } from "../src";
import { axeViolations } from "./axe";

function mockMotionPreference(reduce: boolean) {
  vi.stubGlobal("matchMedia", () => ({
    matches: reduce,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => mockMotionPreference(false));
afterEach(() => vi.unstubAllGlobals());

describe("SparklesText", () => {
  it("renders the real text and adds aria-hidden sparkles after mount", () => {
    const { container } = render(<SparklesText count={5}>Magic</SparklesText>);
    expect(container.firstElementChild?.textContent).toBe("Magic");
    const layer = container.querySelector(".rdm-sparkles-layer");
    expect(layer?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelectorAll(".rdm-sparkle")).toHaveLength(5);
  });

  it("clamps the count and accepts a colour", () => {
    const { container } = render(<SparklesText count={99} color="red">Magic</SparklesText>);
    expect(container.querySelectorAll(".rdm-sparkle")).toHaveLength(20);
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--rdm-c")).toBe("red");
  });

  it("shows no sparkles for reduced motion or isPaused", () => {
    mockMotionPreference(true);
    expect(render(<SparklesText>Magic</SparklesText>).container.querySelector(".rdm-sparkle")).toBeNull();
    mockMotionPreference(false);
    const paused = render(<SparklesText isPaused>Magic</SparklesText>);
    expect(paused.container.querySelector(".rdm-sparkle")).toBeNull();
    expect(paused.container.firstElementChild?.hasAttribute("data-rdm-paused")).toBe(true);
  });

  it("has the text and no sparkles in server HTML, and passes axe", async () => {
    const html = renderToString(<SparklesText>Server</SparklesText>);
    expect(html).toContain("Server");
    expect(html).not.toContain("rdm-sparkle\"");
    const { container } = render(<SparklesText>Magic</SparklesText>);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("AuroraText", () => {
  it("renders text with a gradient built from the colours and a speed", () => {
    const { container } = render(
      <AuroraText colors={["red", "blue"]} speed={2}>
        Aurora
      </AuroraText>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.textContent).toBe("Aurora");
    expect(el.style.getPropertyValue("--rdm-grad")).toBe("linear-gradient(100deg, red, blue, red)");
    expect(el.style.getPropertyValue("--rdm-d")).toBe("5s");
  });

  it("falls back to theme colours and can be paused", () => {
    const { container } = render(<AuroraText isPaused>Aurora</AuroraText>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.getPropertyValue("--rdm-grad")).toContain("--rd-color-action-primary");
    expect(el.hasAttribute("data-rdm-paused")).toBe(true);
  });

  it("is plain text in server HTML and passes axe", async () => {
    expect(renderToString(<AuroraText>Server</AuroraText>)).toContain("Server");
    const { container } = render(<AuroraText>Aurora</AuroraText>);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("LineShadowText", () => {
  it("renders the text once for assistive technology and an aria-hidden shadow copy", () => {
    const { container } = render(<LineShadowText shadowColor="red">Depth</LineShadowText>);
    const layer = container.querySelector(".rdm-line-shadow-layer");
    expect(layer?.getAttribute("aria-hidden")).toBe("true");
    expect(layer?.textContent).toBe("Depth");
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--rdm-c")).toBe("red");
  });

  it("can be paused, renders on the server and passes axe", async () => {
    const { container } = render(<LineShadowText isPaused>Depth</LineShadowText>);
    expect(container.firstElementChild?.hasAttribute("data-rdm-paused")).toBe(true);
    expect(renderToString(<LineShadowText>Server</LineShadowText>)).toContain("Server");
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Text3dFlip", () => {
  it("gives screen readers the whole text and hides the split copy", () => {
    const { container } = render(<Text3dFlip>Hi you</Text3dFlip>);
    expect(container.querySelector(".sr-only")?.textContent).toBe("Hi you");
    const copy = container.querySelector("[aria-hidden='true']") as HTMLElement;
    expect(copy.querySelectorAll(".rdm-flip-unit")).toHaveLength(5);
  });

  it("splits by word", () => {
    const { container } = render(<Text3dFlip by="word">one two three</Text3dFlip>);
    expect(container.querySelectorAll(".rdm-flip-unit")).toHaveLength(3);
  });

  it("sets speed variables and the trigger, and plays on view when intersecting", () => {
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
    const { container } = render(
      <Text3dFlip trigger="view" duration={1} stagger={0.1}>
        Flip
      </Text3dFlip>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("data-trigger")).toBe("view");
    expect(el.style.getPropertyValue("--rdm-d")).toBe("1s");
    expect(el.style.getPropertyValue("--rdm-s")).toBe("0.1s");
    expect(el.hasAttribute("data-rdm-run")).toBe(false);
    act(() => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(el.hasAttribute("data-rdm-run")).toBe(true);
  });

  it("does not play on view for reduced motion or isPaused", () => {
    let created = 0;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor() {
          created += 1;
        }
        observe() {}
        disconnect() {}
      },
    );
    mockMotionPreference(true);
    render(<Text3dFlip trigger="view">Flip</Text3dFlip>);
    mockMotionPreference(false);
    render(
      <Text3dFlip trigger="view" isPaused>
        Flip
      </Text3dFlip>,
    );
    expect(created).toBe(0);
  });

  it("is not focusable by itself, renders on the server and passes axe", async () => {
    const user = userEvent.setup();
    const { container } = render(<Text3dFlip>Flip</Text3dFlip>);
    await user.tab();
    expect(container.contains(document.activeElement)).toBe(false);
    expect(renderToString(<Text3dFlip>Server</Text3dFlip>)).toContain("Server");
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("ComicText", () => {
  it("renders real text with colours and the optional pop-in", () => {
    const { container } = render(
      <ComicText popIn fill="yellow" outline="black">
        Pow
      </ComicText>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.textContent).toBe("Pow");
    expect(el.hasAttribute("data-pop")).toBe(true);
    expect(el.style.getPropertyValue("--rdm-fill")).toBe("yellow");
    expect(el.style.getPropertyValue("--rdm-line")).toBe("black");
  });

  it("has no pop-in by default, can be paused, and passes axe", async () => {
    const plain = render(<ComicText>Pow</ComicText>);
    expect(plain.container.firstElementChild?.hasAttribute("data-pop")).toBe(false);
    const paused = render(
      <ComicText popIn isPaused>
        Pow
      </ComicText>,
    );
    expect(paused.container.firstElementChild?.hasAttribute("data-rdm-paused")).toBe(true);
    expect(renderToString(<ComicText>Server</ComicText>)).toContain("Server");
    expect(await axeViolations(plain.container)).toEqual([]);
  });
});

describe("VideoText", () => {
  it("shows the real text with a fallback and no video when no src is given", () => {
    const { container } = render(<VideoText fallback="linear-gradient(red, blue)">Motion</VideoText>);
    expect(screen.getByText("Motion")).toBeTruthy();
    expect(container.querySelector("video")).toBeNull();
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--rdm-fb")).toBe("linear-gradient(red, blue)");
  });

  it("adds a muted, inline, hidden video after mount and switches to the video look once it loads", () => {
    const { container } = render(
      <VideoText src="clip.mp4" poster="poster.jpg" tone="dark">
        Motion
      </VideoText>,
    );
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.getAttribute("src")).toBe("clip.mp4");
    expect(video.getAttribute("poster")).toBe("poster.jpg");
    expect(video.muted).toBe(true);
    expect(video.hasAttribute("playsinline")).toBe(true);
    expect(video.getAttribute("aria-hidden")).toBe("true");
    expect(video.hasAttribute("controls")).toBe(false);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-tone")).toBe("dark");
    expect(root.hasAttribute("data-rdm-video")).toBe(false);
    fireEvent.loadedData(video);
    expect(root.getAttribute("data-rdm-video")).toBe("on");
    fireEvent.error(video);
    expect(root.hasAttribute("data-rdm-video")).toBe(false);
  });

  it("uses no video when paused or when reduced motion is on", () => {
    const paused = render(
      <VideoText src="clip.mp4" isPaused>
        Motion
      </VideoText>,
    );
    expect(paused.container.querySelector("video")).toBeNull();
    mockMotionPreference(true);
    const reduced = render(<VideoText src="clip.mp4">Motion</VideoText>);
    expect(reduced.container.querySelector("video")).toBeNull();
  });

  it("has no video in server HTML and passes axe", async () => {
    const html = renderToString(<VideoText src="clip.mp4">Server</VideoText>);
    expect(html).toContain("Server");
    expect(html).not.toContain("<video");
    const { container } = render(<VideoText src="clip.mp4">Motion</VideoText>);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("ScrollVelocity", () => {
  let frames: FrameRequestCallback[] = [];
  beforeEach(() => {
    frames = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  it("renders each row once for assistive technology, with aria-hidden repeats", () => {
    const { container } = render(<ScrollVelocity rows={["One", "Two"]} />);
    const rows = container.querySelectorAll(".rdm-sv-row");
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelectorAll(".rdm-sv-copy:not([aria-hidden])")).toHaveLength(1);
    expect(rows[0].querySelectorAll(".rdm-sv-dup[aria-hidden='true']").length).toBeGreaterThan(0);
  });

  it("pauses from the button and from isPaused", async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<ScrollVelocity rows={["One"]} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-rdm-paused")).toBe(false);
    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(root.hasAttribute("data-rdm-paused")).toBe(true);
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(root.hasAttribute("data-rdm-paused")).toBe(false);
    rerender(<ScrollVelocity rows={["One"]} isPaused />);
    expect(root.hasAttribute("data-rdm-paused")).toBe(true);
  });

  it("can hide the button and uses custom labels", () => {
    const hidden = render(<ScrollVelocity rows={["One"]} showPauseButton={false} />);
    expect(hidden.container.querySelector("button")).toBeNull();
    hidden.unmount();
    render(<ScrollVelocity rows={["One"]} pauseLabel="Stop" />);
    expect(screen.getByRole("button", { name: "Stop" })).toBeTruthy();
  });

  it("does not move for reduced motion, and moves alternate rows in opposite directions otherwise", () => {
    mockMotionPreference(true);
    const reduced = render(<ScrollVelocity rows={["One"]} />);
    act(() => frames.shift()?.(16));
    expect((reduced.container.querySelector(".rdm-sv-track") as HTMLElement).style.transform).toBe("");
    reduced.unmount();

    mockMotionPreference(false);
    const { container } = render(<ScrollVelocity rows={["One", "Two"]} speed={100} />);
    for (const copy of container.querySelectorAll<HTMLElement>(".rdm-sv-copy:not(.rdm-sv-dup)")) {
      Object.defineProperty(copy, "offsetWidth", { configurable: true, value: 500 });
    }
    // First frame sets the clock; the next moves the rows.
    let now = performance.now();
    for (let i = 0; i < 4; i++) {
      const next = frames.shift();
      now += 50;
      act(() => next?.(now));
    }
    const [a, b] = Array.from(container.querySelectorAll<HTMLElement>(".rdm-sv-track")).map((t) => t.style.transform);
    expect(a).toContain("translate3d(");
    expect(b).toContain("translate3d(");
    expect(a).not.toBe(b);
  });

  it("is real text in server HTML and passes axe", async () => {
    expect(renderToString(<ScrollVelocity rows={["Server row"]} />)).toContain("Server row");
    const { container } = render(<ScrollVelocity rows={["One", "Two"]} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
