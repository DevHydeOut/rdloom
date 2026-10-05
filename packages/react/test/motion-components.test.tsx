import fs from "node:fs";
import path from "node:path";
import { act, createEvent, fireEvent, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BlurFade,
  GradientButton,
  GradientText,
  PulseButton,
  RevealButton,
  Ripple,
  RippleButton,
  ShimmerButton,
  ShineBorder,
  ShuttleBorder,
  TextShimmer,
  useReducedMotion,
} from "../src";
import { motionVars } from "../src/utils/motion";
import { axeViolations } from "./axe";

// The motion rules live in one CSS file that the CLI installs and imports. jsdom leaves
// import.meta.url as a non-file URL, so find the package by walking up from the working directory.
function packageRoot(): string {
  for (let dir = process.cwd(); ; dir = path.dirname(dir)) {
    for (const candidate of [dir, path.join(dir, "packages", "react")]) {
      if (fs.existsSync(path.join(candidate, "src", "motion", "rdloom-motion.css"))) return candidate;
    }
    if (dir === path.dirname(dir)) throw new Error("packages/react not found above " + process.cwd());
  }
}
const root = packageRoot();
const motionCss = fs.readFileSync(path.join(root, "src", "motion", "rdloom-motion.css"), "utf8");
const reducedBlock = motionCss.slice(motionCss.indexOf("@media (prefers-reduced-motion: reduce)"), motionCss.indexOf(".rdm-still .rdm-shimmer"));
const stillBlock = motionCss.slice(motionCss.indexOf(".rdm-still .rdm-shimmer"));

/** The effect has a still version for reduced motion, and the same one inside .rdm-still. */
function standsStill(selector: string) {
  expect(reducedBlock, `${selector} has no reduced-motion rule`).toContain(selector);
  expect(stillBlock, `${selector} has no .rdm-still rule`).toContain(`.rdm-still ${selector}`);
}

function mockMotionPreference(reduce: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: reduce,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  vi.stubGlobal("matchMedia", () => query);
  return {
    set(value: boolean) {
      query.matches = value;
      listeners.forEach((fn) => fn());
    },
  };
}

beforeEach(() => mockMotionPreference(false));
afterEach(() => vi.unstubAllGlobals());

describe("the motion CSS", () => {
  const classes = [...motionCss.matchAll(/(?:^|[\s,>])\.(rdm-[a-z-]+)/gm)].map((m) => m[1]);

  it("gives every animated class a still version for reduced motion and for .rdm-still, and the two lists match", () => {
    const selectors = (block: string) => [...new Set([...block.matchAll(/\.rdm-(?!still)[a-z-]+/g)].map((m) => m[0]))].sort();
    expect(selectors(stillBlock)).toEqual(selectors(reducedBlock));
    for (const animated of [".rdm-shimmer", ".rdm-ripple", ".rdm-pulse", ".rdm-gradient", ".rdm-shuttle", ".rdm-shine", ".rdm-text-shimmer", ".rdm-gradient-text", ".rdm-ring"]) {
      standsStill(animated);
    }
  });

  it("defines every motion class the components use, so nothing renders unstyled", () => {
    const used = new Set<string>();
    for (const dir of fs.readdirSync(path.join(root, "src"))) {
      const file = path.join(root, "src", dir, `${dir}.tsx`);
      if (!fs.existsSync(file)) continue;
      for (const [, name] of fs.readFileSync(file, "utf8").matchAll(/["' ](rdm-[a-z-]+)/g)) used.add(name);
    }
    expect(used.size).toBeGreaterThan(5);
    for (const name of used) expect(classes, `.${name} is used but not defined`).toContain(name);
  });

  it("defines the animation every class refers to", () => {
    for (const [, name] of motionCss.matchAll(/animation:\s*(rdm-[a-z-]+)/g)) expect(motionCss).toContain(`@keyframes ${name}`);
  });

  it("gives every effect a default speed, so a stripped style attribute still leaves it moving at a sensible pace", () => {
    for (const [, vars] of motionCss.matchAll(/animation:\s*rdm-[a-z-]+\s+([^;]+);/g)) expect(vars).toMatch(/var\(--rdm-d,\s*[\d.]+m?s\)/);
  });

  it("draws the text effects plainly in high-contrast mode", () => {
    const block = motionCss.slice(motionCss.indexOf("@media (forced-colors: active)"));
    expect(block).toContain(".rdm-text-shimmer");
    expect(block).toContain(".rdm-gradient-text");
    expect(block).toContain("CanvasText");
  });

  it("lets pointer events through the decorative layers", () => {
    for (const layer of [".rdm-shuttle {", ".rdm-shine {", ".rdm-shimmer {", ".rdm-ring {", ".rdm-ripple {"]) {
      const start = motionCss.indexOf(layer);
      expect(motionCss.slice(start, motionCss.indexOf("}", start)), layer).toContain("pointer-events: none");
    }
  });

  it("registers the angle property the rotating borders animate", () => {
    expect(motionCss).toContain("@property --rdm-angle");
  });

  it("is plain CSS with no inline-style needs: nothing in the components renders a <style> tag", () => {
    const { container } = render(
      <>
        <ShimmerButton>a</ShimmerButton>
        <RippleButton>b</RippleButton>
        <PulseButton>c</PulseButton>
        <GradientButton>d</GradientButton>
        <RevealButton>e</RevealButton>
        <ShuttleBorder>f</ShuttleBorder>
        <ShineBorder>g</ShineBorder>
        <TextShimmer>h</TextShimmer>
        <GradientText>i</GradientText>
        <Ripple>j</Ripple>
        <BlurFade>k</BlurFade>
      </>,
    );
    expect(container.querySelectorAll("style")).toHaveLength(0);
    expect(renderToString(<ShuttleBorder>x</ShuttleBorder>)).not.toContain("<style");
  });
});

describe("motion helpers", () => {
  it("motionVars keeps only the values that were given", () => {
    expect(motionVars({ "--a": 1, "--b": undefined, "--c": "x" })).toEqual({ "--a": 1, "--c": "x" });
  });

  it("useReducedMotion follows the setting, and a change to it", () => {
    const preference = mockMotionPreference(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => preference.set(true));
    expect(result.current).toBe(true);
  });
});

describe("ShimmerButton", () => {
  it("is a button named by its label, and the shimmer layer is hidden from assistive technology", () => {
    const { container } = render(<ShimmerButton>Start free trial</ShimmerButton>);
    expect(screen.getByRole("button", { name: "Start free trial" })).toBeInTheDocument();
    expect(container.querySelector(".rdm-shimmer")).toHaveAttribute("aria-hidden", "true");
  });

  it("uses classes from the motion CSS, writes no style tag, and stands still for reduced motion", () => {
    const { container } = render(<ShimmerButton>Go</ShimmerButton>);
    expect(container.querySelector("style")).toBeNull();
    expect(container.querySelector(".rdm-shimmer")).toBeInTheDocument();
    expect(motionCss).toContain("@keyframes rdm-shimmer");
    standsStill(".rdm-shimmer");
  });

  it("can be paused, and its speed is set", () => {
    render(
      <ShimmerButton isPaused duration={4}>
        Go
      </ShimmerButton>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-rdm-paused");
    expect(button.style.getPropertyValue("--rdm-d")).toBe("4s");
  });

  it("is still a Button: presses, disabled and variants work", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { rerender } = render(<ShimmerButton onPress={onPress}>Go</ShimmerButton>);
    await user.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
    rerender(
      <ShimmerButton onPress={onPress} isDisabled>
        Go
      </ShimmerButton>,
    );
    await user.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("keeps its own classes and forwards the ref", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <ShimmerButton ref={ref} className="extra">
        Go
      </ShimmerButton>,
    );
    expect(ref.current).toBe(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveClass("extra", "relative", "overflow-hidden");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <ShimmerButton>One</ShimmerButton>
        <ShimmerButton variant="secondary" isPaused>
          Two
        </ShimmerButton>
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("RippleButton", () => {
  const press = (button: HTMLElement, x: number, y: number) => {
    button.getBoundingClientRect = () => ({ left: 10, top: 20, width: 100, height: 40, right: 110, bottom: 60, x: 10, y: 20, toJSON: () => ({}) });
    const event = createEvent.pointerDown(button);
    Object.defineProperty(event, "clientX", { value: x });
    Object.defineProperty(event, "clientY", { value: y });
    fireEvent(button, event);
  };

  it("sends a ripple out from where the pointer pressed", () => {
    const { container } = render(<RippleButton>Press</RippleButton>);
    press(screen.getByRole("button"), 40, 30);
    const wave = container.querySelector<HTMLElement>(".rdm-ripple")!;
    expect(wave).toBeInTheDocument();
    expect(wave.style.left).toBe("30px"); // 40 - the button's left edge
    expect(wave.style.top).toBe("10px");
    expect(wave).toHaveAttribute("aria-hidden", "true");
    // Big enough to reach the far corner from there.
    expect(parseFloat(wave.style.width)).toBeCloseTo(Math.hypot(70, 30) * 2);
  });

  it("removes each ripple when it finishes, so many presses don't pile up", () => {
    const { container } = render(<RippleButton>Press</RippleButton>);
    const button = screen.getByRole("button");
    press(button, 20, 30);
    press(button, 60, 30);
    expect(container.querySelectorAll(".rdm-ripple")).toHaveLength(2);
    fireEvent.animationEnd(container.querySelector(".rdm-ripple")!);
    expect(container.querySelectorAll(".rdm-ripple")).toHaveLength(1);
  });

  it("ripples from the centre for a key press", async () => {
    const user = userEvent.setup();
    const { container } = render(<RippleButton>Press</RippleButton>);
    screen.getByRole("button").getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40, right: 100, bottom: 40, x: 0, y: 0, toJSON: () => ({}) });
    screen.getByRole("button").focus();
    await user.keyboard("{Enter}");
    const wave = container.querySelector<HTMLElement>(".rdm-ripple")!;
    expect(wave.style.left).toBe("50px");
    expect(wave.style.top).toBe("20px");
  });

  it("still presses like a Button, and hides ripples for reduced motion", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { container } = render(<RippleButton onPress={onPress}>Press</RippleButton>);
    await user.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(container.querySelector("style")).toBeNull();
    standsStill(".rdm-ripple");
  });

  it("takes its duration", () => {
    render(<RippleButton duration={900}>Press</RippleButton>);
    expect(screen.getByRole("button").style.getPropertyValue("--rdm-d")).toBe("900ms");
  });

  it("forwards the ref", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<RippleButton ref={ref}>Press</RippleButton>);
    expect(ref.current).toBe(screen.getByRole("button"));
  });

  it("has no axe violations", async () => {
    const { container } = render(<RippleButton>Press</RippleButton>);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("PulseButton", () => {
  it("pulses, in the colour you pick, and its label is the whole name", () => {
    render(<PulseButton color="rebeccapurple">Claim offer</PulseButton>);
    const button = screen.getByRole("button", { name: "Claim offer" });
    expect(button).toHaveClass("rdm-pulse");
    expect(button.style.getPropertyValue("--rdm-c")).toBe("rebeccapurple");
  });

  it("stops for reduced motion, and can be paused or disabled", () => {
    const { rerender } = render(<PulseButton isPaused>Go</PulseButton>);
    standsStill(".rdm-pulse");
    expect(screen.getByRole("button")).toHaveAttribute("data-rdm-paused");
    expect(motionCss).toContain(".rdm-pulse[data-disabled]");
    rerender(<PulseButton isDisabled>Go</PulseButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("has no axe violations", async () => {
    const { container } = render(<PulseButton>Go</PulseButton>);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("GradientButton", () => {
  it("draws a travelling colour round the edge, and closes the loop", () => {
    const { container } = render(<GradientButton colors={["red", "green", "blue"]}>Try it</GradientButton>);
    const edge = container.querySelector<HTMLElement>(".rdm-gradient")!;
    expect(edge.style.backgroundImage).toContain("conic-gradient");
    expect(edge.style.backgroundImage).toContain("red, green, blue, red");
    expect(edge.style.padding).toBe("2px");
  });

  it("puts the label on the normal button surface, as a secondary Button by default", () => {
    render(<GradientButton>Try it</GradientButton>);
    expect(screen.getByRole("button", { name: "Try it" })).toBeInTheDocument();
    expect(screen.getByRole("button").className).toContain("bg-[var(--rd-color-surface-default)]");
  });

  it("takes the thickness and speed", () => {
    const { container } = render(
      <GradientButton borderWidth={4} duration={1.5}>
        Try it
      </GradientButton>,
    );
    const edge = container.querySelector<HTMLElement>(".rdm-gradient")!;
    expect(edge.style.padding).toBe("4px");
    expect(edge.style.getPropertyValue("--rdm-d")).toBe("1.5s");
  });

  it("stops for reduced motion, when paused, and when disabled", () => {
    const { container, rerender } = render(<GradientButton isPaused>Try it</GradientButton>);
    standsStill(".rdm-gradient");
    expect(container.querySelector(".rdm-gradient")).toHaveAttribute("data-rdm-paused");
    rerender(<GradientButton isDisabled>Try it</GradientButton>);
    expect(container.querySelector(".rdm-gradient")).toHaveAttribute("data-rdm-paused");
    expect(container.querySelector(".rdm-gradient")).toHaveClass("opacity-50");
  });

  it("still presses like a Button", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<GradientButton onPress={onPress}>Try it</GradientButton>);
    await user.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("has no axe violations", async () => {
    const { container } = render(<GradientButton>Try it</GradientButton>);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("RevealButton", () => {
  it("is named by its label only: the arrow is decoration", () => {
    const { container } = render(<RevealButton>Read more</RevealButton>);
    expect(screen.getByRole("button", { name: "Read more" })).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("opens the arrow on focus as well as hover, and switches the motion off for reduced motion", () => {
    const { container } = render(<RevealButton>Read more</RevealButton>);
    const arrow = container.querySelector("svg")!.getAttribute("class")!;
    expect(arrow).toContain("group-data-[hovered]:w-4");
    expect(arrow).toContain("group-data-[focus-visible]:w-4");
    expect(arrow).toContain("motion-reduce:transition-none");
  });

  it("still presses like a Button", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<RevealButton onPress={onPress}>Go</RevealButton>);
    await user.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("has no axe violations", async () => {
    const { container } = render(<RevealButton variant="secondary">Next</RevealButton>);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("ShuttleBorder", () => {
  it("wraps content with a light layer that is hidden from assistive technology", () => {
    const { container } = render(
      <ShuttleBorder>
        <p>Pro plan</p>
      </ShuttleBorder>,
    );
    expect(screen.getByText("Pro plan")).toBeInTheDocument();
    expect(container.querySelector(".rdm-shuttle")).toHaveAttribute("aria-hidden", "true");
  });

  it("takes colour, speed and thickness, and can be paused", () => {
    const { container } = render(
      <ShuttleBorder color="tomato" duration={6} borderWidth={3} isPaused>
        x
      </ShuttleBorder>,
    );
    const box = container.querySelector<HTMLElement>("[data-rdm-paused]")!;
    expect(box.style.getPropertyValue("--rdm-c")).toBe("tomato");
    expect(box.style.getPropertyValue("--rdm-d")).toBe("6s");
    expect(box.style.getPropertyValue("--rdm-w")).toBe("3px");
  });

  it("stands still for reduced motion", () => {
    render(<ShuttleBorder>x</ShuttleBorder>);
    standsStill(".rdm-shuttle");
    expect(motionCss).toContain("@property --rdm-angle");
  });

  it("lets the pointer through to the content", () => {
    const start = motionCss.indexOf(".rdm-shuttle {");
    expect(motionCss.slice(start, motionCss.indexOf("}", start))).toContain("pointer-events: none");
  });

  it("renders on the server with no client code", () => {
    expect(renderToString(<ShuttleBorder>Server</ShuttleBorder>)).toContain("Server");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ShuttleBorder>
        <p>Card</p>
      </ShuttleBorder>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("ShineBorder", () => {
  it("slides a band of your colours along the border", () => {
    const { container } = render(
      <ShineBorder colors={["red", "blue"]} duration={3}>
        x
      </ShineBorder>,
    );
    const layer = container.querySelector<HTMLElement>(".rdm-shine")!;
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer.style.backgroundImage).toContain("red, blue, red");
  });

  it("can be paused and stands still for reduced motion", () => {
    const { container } = render(<ShineBorder isPaused>x</ShineBorder>);
    expect(container.querySelector("[data-rdm-paused]")).toBeInTheDocument();
    standsStill(".rdm-shine");
  });

  it("renders on the server with no client code", () => {
    expect(renderToString(<ShineBorder>Server</ShineBorder>)).toContain("Server");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ShineBorder>
        <p>Card</p>
      </ShineBorder>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("TextShimmer", () => {
  it("keeps the words as real, readable text", () => {
    render(<TextShimmer>Thinking…</TextShimmer>);
    expect(screen.getByText("Thinking…")).toBeInTheDocument();
  });

  it("takes its colours and speed", () => {
    render(
      <TextShimmer baseColor="gray" highlightColor="black" duration={1.2}>
        Hi
      </TextShimmer>,
    );
    const el = screen.getByText("Hi");
    expect(el.style.getPropertyValue("--rdm-base")).toBe("gray");
    expect(el.style.getPropertyValue("--rdm-hi")).toBe("black");
    expect(el.style.getPropertyValue("--rdm-d")).toBe("1.2s");
  });

  it("is drawn plainly in reduced motion and in high-contrast mode", () => {
    render(<TextShimmer>Hi</TextShimmer>);
    standsStill(".rdm-text-shimmer");
    expect(reducedBlock).toContain("color: var(--rdm-base, var(--rd-color-text-default))");
    expect(motionCss.slice(motionCss.indexOf("@media (forced-colors: active)"))).toContain(".rdm-text-shimmer");
  });

  it("can be paused, and renders on the server", () => {
    render(<TextShimmer isPaused>Hi</TextShimmer>);
    expect(screen.getByText("Hi")).toHaveAttribute("data-rdm-paused");
    expect(renderToString(<TextShimmer>Server</TextShimmer>)).toContain("Server");
  });

  it("has no axe violations", async () => {
    const { container } = render(<TextShimmer>Thinking…</TextShimmer>);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("GradientText", () => {
  it("fills the words with your colours, looping back to the first", () => {
    render(<GradientText colors={["red", "blue"]}>Build</GradientText>);
    expect(screen.getByText("Build").style.backgroundImage).toContain("red, blue, red");
  });

  it("falls back to its first colour, plainly, for reduced motion and high contrast", () => {
    render(<GradientText colors={["red", "blue"]}>Build</GradientText>);
    // The still colour is the first one you chose, handed to the stylesheet as a variable.
    expect(screen.getByText("Build").style.getPropertyValue("--rdm-first")).toBe("red");
    standsStill(".rdm-gradient-text");
    expect(reducedBlock).toContain("color: var(--rdm-first,");
  });

  it("defaults to colours that read on the page", () => {
    render(<GradientText>Build</GradientText>);
    expect(screen.getByText("Build").style.backgroundImage).toContain("var(--rd-color-action-primary)");
  });

  it("renders on the server, and has no axe violations", async () => {
    expect(renderToString(<GradientText>Server</GradientText>)).toContain("Server");
    const { container } = render(<GradientText>Build</GradientText>);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Ripple", () => {
  it("draws the rings in a layer hidden from assistive technology, behind the content", () => {
    const { container } = render(
      <Ripple rings={4}>
        <p>Join the waitlist</p>
      </Ripple>,
    );
    expect(screen.getByText("Join the waitlist")).toBeInTheDocument();
    const layer = container.querySelector(".rdm-ring")!.parentElement!;
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer.querySelectorAll(".rdm-ring")).toHaveLength(4);
  });

  it("keeps the ring count between 1 and 12", () => {
    const { container, rerender } = render(<Ripple rings={0} />);
    expect(container.querySelectorAll(".rdm-ring")).toHaveLength(1);
    rerender(<Ripple rings={99} />);
    expect(container.querySelectorAll(".rdm-ring")).toHaveLength(12);
  });

  it("grows each ring from the size you give, fainter as it goes out", () => {
    const { container } = render(<Ripple size={100} rings={3} />);
    const rings = [...container.querySelectorAll<HTMLElement>(".rdm-ring")];
    expect(rings.map((r) => r.style.width)).toEqual(["100px", "170px", "240px"]);
    expect(Number(rings[0].style.opacity)).toBeGreaterThan(Number(rings[2].style.opacity));
  });

  it("can be coloured and paused, and stands still for reduced motion", () => {
    const { container } = render(<Ripple color="teal" isPaused />);
    const box = container.querySelector<HTMLElement>("[data-rdm-paused]")!;
    expect(box.style.getPropertyValue("--rdm-c")).toBe("teal");
    standsStill(".rdm-ring");
  });

  it("renders on the server, and has no axe violations", async () => {
    expect(renderToString(<Ripple>Server</Ripple>)).toContain("Server");
    const { container } = render(
      <Ripple>
        <p>Hello</p>
      </Ripple>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("BlurFade", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const phase = (container: HTMLElement) => container.querySelector("[data-blur-fade]")!.getAttribute("data-blur-fade");

  it("is visible in the server-rendered page, so no one is left without the content", () => {
    const html = renderToString(<BlurFade>Server content</BlurFade>);
    expect(html).toContain("Server content");
    expect(html).toContain('data-blur-fade="visible"');
    expect(html).not.toContain("opacity:0");
  });

  it("hides before the first paint once running, then reveals after its delay", () => {
    const { container } = render(
      <BlurFade whenInView={false} delay={0.2}>
        Hello
      </BlurFade>,
    );
    expect(phase(container)).toBe("hidden");
    const el = container.querySelector<HTMLElement>("[data-blur-fade]")!;
    expect(el.style.opacity).toBe("0");
    expect(el.style.filter).toBe("blur(6px)");
    act(() => void vi.advanceTimersByTime(250));
    expect(phase(container)).toBe("shown");
    expect(el.style.opacity).toBe("1");
    expect(el.style.transition).toContain("opacity 0.5s");
  });

  it("keeps the content in the page while it is hidden: assistive technology can still read it", () => {
    render(<BlurFade whenInView={false}>Readable</BlurFade>);
    expect(screen.getByText("Readable")).toBeInTheDocument();
    expect(screen.getByText("Readable")).not.toHaveAttribute("hidden");
  });

  it("with reduced motion it is never hidden", () => {
    mockMotionPreference(true);
    const { container } = render(<BlurFade whenInView={false}>Hello</BlurFade>);
    expect(phase(container)).toBe("visible");
  });

  describe("when in view", () => {
    let trigger: (isIntersecting: boolean) => void = () => {};
    const disconnect = vi.fn();

    beforeEach(() => {
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
            trigger = (isIntersecting) => cb([{ isIntersecting }]);
          }
          observe() {}
          disconnect = disconnect;
        },
      );
    });

    it("waits until it scrolls into view", () => {
      const { container } = render(<BlurFade>Hello</BlurFade>);
      expect(phase(container)).toBe("hidden");
      act(() => trigger(false));
      act(() => void vi.advanceTimersByTime(1000));
      expect(phase(container)).toBe("hidden");
      act(() => trigger(true));
      act(() => void vi.advanceTimersByTime(10));
      expect(phase(container)).toBe("shown");
    });

    it("stops watching once it has shown", () => {
      render(<BlurFade>Hello</BlurFade>);
      act(() => trigger(true));
      expect(disconnect).toHaveBeenCalled();
    });
  });

  it("reveals at once if the browser cannot watch for scrolling", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<BlurFade>Hello</BlurFade>);
    act(() => void vi.advanceTimersByTime(10));
    expect(phase(container)).toBe("shown");
  });

  it("takes the offset, blur and duration, and forwards the ref", () => {
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(
      <BlurFade ref={ref} whenInView={false} offset={20} blur={12} duration={1}>
        Hello
      </BlurFade>,
    );
    const el = container.querySelector<HTMLElement>("[data-blur-fade]")!;
    expect(ref.current).toBe(el);
    expect(el.style.transform).toBe("translateY(20px)");
    expect(el.style.filter).toBe("blur(12px)");
    act(() => void vi.advanceTimersByTime(10));
    expect(el.style.transition).toContain("1s");
  });

  it("cleans up its timer if it unmounts before revealing", () => {
    const { unmount } = render(
      <BlurFade whenInView={false} delay={5}>
        Hello
      </BlurFade>,
    );
    unmount();
    expect(() => vi.advanceTimersByTime(6000)).not.toThrow();
  });
});

describe("BlurFade accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = render(
      <BlurFade whenInView={false}>
        <p>Content</p>
      </BlurFade>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
