import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DottedMap, Globe, type WorldMarker } from "../src";
import { isLand, landSpherePoints } from "../src/utils/world-dots";
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
function stubCanvas(size = 300) {
  const calls: string[] = [];
  const ctx = new Proxy(
    {},
    {
      get: (_, name: string) =>
        name === "canvas"
          ? undefined
          : (...args: unknown[]) => {
              // A real canvas throws on a negative radius, so the stub does too.
              if (name === "arc" && Number(args[2]) < 0) throw new Error(`The radius provided (${args[2]}) is negative.`);
              calls.push(name);
            },
      set: () => true,
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => ctx) as never);
  // jsdom has no layout: give the container a size so something is drawn.
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () => ({ width: size, height: size, top: 0, left: 0, right: size, bottom: size, x: 0, y: 0, toJSON() {} }) as DOMRect,
  );
  return calls;
}

let frames: FrameRequestCallback[] = [];
const cancelled = vi.fn();
const flush = (now: number) => {
  const run = frames;
  frames = [];
  act(() => run.forEach((fn) => fn(now)));
};

beforeEach(() => {
  mockMotionPreference(false);
  frames = [];
  cancelled.mockClear();
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => frames.push(fn));
  vi.stubGlobal("cancelAnimationFrame", () => {
    cancelled();
    frames = [];
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const places: WorldMarker[] = [
  { lat: 51.5, lng: -0.1, label: "London" },
  { lat: 35.7, lng: 139.7, label: "Tokyo" },
];

describe("the world dot data", () => {
  it("puts land where it belongs and sea elsewhere", () => {
    expect(isLand(48, 10)).toBe(true); // central Europe
    expect(isLand(-25, 134)).toBe(true); // Australia
    expect(isLand(0, -150)).toBe(false); // central Pacific
    expect(isLand(-30, -20)).toBe(false); // south Atlantic
    expect(landSpherePoints(4).length / 3).toBeGreaterThan(400);
    // Places a recognisable map must get right.
    expect(isLand(48.9, 2.4)).toBe(true); // Paris
    expect(isLand(40.4, -3.7)).toBe(true); // Madrid
    expect(isLand(52, -1)).toBe(true); // Great Britain
    expect(isLand(36, 138)).toBe(true); // Japan
    expect(isLand(-19, 47)).toBe(true); // Madagascar
    expect(isLand(35, 18)).toBe(false); // the Mediterranean
    expect(isLand(60, -85)).toBe(false); // Hudson Bay
    expect(isLand(20, 38)).toBe(false); // the Red Sea
  });
});

describe("Globe", () => {
  it("is a labelled group with a hidden description and a real list of the markers, and the canvas is hidden", async () => {
    stubCanvas();
    const { container } = render(<Globe label="Our offices" description="A globe." markers={places} />);
    expect(screen.getByRole("group", { name: "Our offices" })).toBeInTheDocument();
    expect(screen.getByText("A globe.")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["London", "Tokyo"]);
    expect(container.querySelector("canvas")).toHaveAttribute("aria-hidden", "true");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("draws nothing, and does not throw, while the container has no size yet", () => {
    const calls = stubCanvas(0);
    expect(() => render(<Globe markers={places} />)).not.toThrow();
    flush(1000);
    expect(calls.filter((c) => c === "arc")).toHaveLength(0);
  });

  it("draws and keeps animating while moving", () => {
    const calls = stubCanvas();
    render(<Globe markers={places} />);
    const first = calls.filter((c) => c === "arc").length;
    expect(first).toBeGreaterThan(0);
    flush(1000);
    flush(1016);
    expect(calls.filter((c) => c === "arc").length).toBeGreaterThan(first);
  });

  it("draws one still frame and no loop for reduced motion, and for isPaused", () => {
    mockMotionPreference(true);
    const calls = stubCanvas();
    const reduced = render(<Globe markers={places} />);
    expect(calls.filter((c) => c === "arc").length).toBeGreaterThan(0);
    reduced.unmount();
    mockMotionPreference(false);
    frames = [];
    const paused = render(<Globe isPaused />);
    expect(paused.container.firstElementChild).toHaveAttribute("data-rdm-paused");
    expect(frames).toHaveLength(0);
  });

  it("cancels its frame on unmount and survives a missing canvas", () => {
    stubCanvas();
    const { unmount } = render(<Globe />);
    unmount();
    expect(cancelled).toHaveBeenCalled();
    vi.restoreAllMocks();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => null) as never);
    expect(() => render(<Globe markers={places} />)).not.toThrow();
  });

  it("renders its text on the server", () => {
    const html = renderToString(<Globe label="Offices" markers={places} />);
    expect(html).toContain("London");
    expect(html).toContain('aria-label="Offices"');
  });
});

describe("DottedMap", () => {
  it("lists the places and the connections as text and ignores unknown connection labels", async () => {
    stubCanvas();
    const { container } = render(
      <DottedMap
        label="Links"
        description="Two cities joined."
        markers={places}
        connections={[
          { from: "London", to: "Tokyo" },
          { from: "London", to: "Nowhere" },
        ]}
      />,
    );
    expect(screen.getByRole("group", { name: "Links" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["London", "Tokyo", "London to Tokyo"]);
    expect(container.querySelector("canvas")).toHaveAttribute("aria-hidden", "true");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("pulses the arcs while moving and draws them without a pulse when still", () => {
    const calls = stubCanvas();
    render(<DottedMap markers={places} connections={[{ from: "London", to: "Tokyo" }]} />);
    const still = calls.filter((c) => c === "quadraticCurveTo").length;
    expect(still).toBe(1);
    flush(1000);
    flush(1016);
    expect(calls.filter((c) => c === "quadraticCurveTo").length).toBeGreaterThan(still);
  });

  it("stands still for reduced motion and isPaused", () => {
    mockMotionPreference(true);
    stubCanvas();
    render(<DottedMap markers={places} connections={[{ from: "London", to: "Tokyo" }]} />);
    flush(1000);
    expect(frames).toHaveLength(0);
    vi.restoreAllMocks();
    mockMotionPreference(false);
    stubCanvas();
    const paused = render(<DottedMap isPaused />);
    expect(paused.container.firstElementChild).toHaveAttribute("data-rdm-paused");
    expect(frames).toHaveLength(0);
  });

  it("cancels its frame on unmount and renders on the server", () => {
    stubCanvas();
    const { unmount } = render(<DottedMap />);
    unmount();
    expect(cancelled).toHaveBeenCalled();
    expect(renderToString(<DottedMap label="Map" markers={places} />)).toContain("Tokyo");
  });
});

describe("inland seas", () => {
  it("leave the Black Sea and the Caspian empty while their shores stay land", () => {
    expect(isLand(43.5, 34)).toBe(false); // Black Sea
    expect(isLand(42, 51)).toBe(false); // Caspian
    expect(isLand(50, 30)).toBe(true); // Ukraine
  });
});
