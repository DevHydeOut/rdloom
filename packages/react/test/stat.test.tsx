import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Sparkline } from "../src/sparkline/sparkline";
import { Stat } from "../src/stat/stat";
import { axeViolations } from "./axe";

const reading = (c: HTMLElement) => c.querySelector(".sr-only")!.textContent;

describe("Stat", () => {
  it("formats numbers and keeps strings", () => {
    const { container, rerender } = render(<Stat label="Users" value={12840} />);
    expect(reading(container)).toBe(`Users: ${(12840).toLocaleString()}.`);
    rerender(<Stat label="Revenue" value={5} format={(n) => `$${n}.00`} />);
    expect(reading(container)).toBe("Revenue: $5.00.");
    rerender(<Stat label="Plan" value="Pro" />);
    expect(reading(container)).toBe("Plan: Pro.");
  });

  it("shows a unit", () => {
    const { container } = render(<Stat label="Churn" value={2.4} unit="%" />);
    expect(screen.getByText("%")).toBeInTheDocument();
    expect(reading(container)).toBe("Churn: 2.4%.");
  });

  it("says the direction in words", () => {
    const { container, rerender } = render(<Stat label="Revenue" value={10} trend={{ change: 12, label: "vs last month" }} />);
    expect(reading(container)).toBe("Revenue: 10. Up 12% compared with last month.");
    rerender(<Stat label="Revenue" value={10} trend={{ change: -3 }} />);
    expect(reading(container)).toBe("Revenue: 10. Down 3%.");
    rerender(<Stat label="Revenue" value={10} trend={{ change: 0 }} />);
    expect(reading(container)).toBe("Revenue: 10. No change.");
  });

  it("goodWhen changes the tint, not the direction words", () => {
    const { container, rerender } = render(<Stat label="Churn" value={2} trend={{ change: 5 }} />);
    const pill = () => container.querySelector("span.rounded-full")!;
    expect(pill().className).toContain("success-subtle");
    expect(reading(container)).toContain("Up 5%");
    rerender(<Stat label="Churn" value={2} trend={{ change: 5, goodWhen: "down" }} />);
    expect(pill().className).toContain("danger-subtle");
    expect(reading(container)).toContain("Up 5%");
    expect(reading(container)).toContain("worse");
  });

  it("shows a description and a sparkline when given data", () => {
    const { container } = render(<Stat label="Signups" value={3} description="All plans" data={[1, 2, 3]} />);
    expect(reading(container)).toContain("All plans");
    expect(container.querySelector("svg[data-type='area']")).toBeInTheDocument();
  });

  it("has a loading state", () => {
    const { container } = render(<Stat label="Revenue" value={1} isLoading />);
    expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
    expect(reading(container)).toBe("Loading Revenue");
  });

  it("changes the value size", () => {
    const { container, rerender } = render(<Stat label="A" value={1} size="sm" />);
    expect(container.querySelector("p.tabular-nums")).toHaveClass("text-xl");
    rerender(<Stat label="A" value={1} size="lg" />);
    expect(container.querySelector("p.tabular-nums")).toHaveClass("text-4xl");
  });

  it("renders on the server", () => {
    expect(renderToString(<Stat label="Users" value={3} trend={{ change: 1 }} data={[1, 2]} />)).toContain("Users");
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <>
        <Stat label="A" value={1} />
        <Stat label="B" value={2} unit="%" trend={{ change: 4, label: "vs last month" }} data={[1, 3, 2]} description="Context" />
        <Stat label="C" value={3} trend={{ change: -4, goodWhen: "down" }} size="lg" />
        <Stat label="D" value={4} trend={{ change: 0 }} size="sm" />
        <Stat label="E" value={5} isLoading />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Sparkline", () => {
  it("draws one point per value for a line", () => {
    const { container } = render(<Sparkline data={[1, 2, 3, 4]} />);
    expect(container.querySelector("polyline")!.getAttribute("points")!.split(" ")).toHaveLength(4);
    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });

  it("can hide the last dot", () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} showLast={false} />);
    expect(container.querySelector("circle")).toBeNull();
  });

  it("draws one bar per value", () => {
    const { container } = render(<Sparkline type="bar" data={[1, 2, 3]} />);
    expect(container.querySelectorAll("rect")).toHaveLength(3);
  });

  it("centers flat data", () => {
    const { container } = render(<Sparkline data={[5, 5, 5]} height={32} />);
    const ys = container
      .querySelector("polyline")!
      .getAttribute("points")!
      .split(" ")
      .map((p) => p.split(",")[1]);
    expect(new Set(ys)).toEqual(new Set(["16"]));
  });

  it("handles one point, two points and no data", () => {
    const one = render(<Sparkline data={[3]} />).container;
    expect(one.querySelector("polyline")).toBeNull();
    expect(one.querySelectorAll("circle")).toHaveLength(1);
    const two = render(<Sparkline data={[3, 4]} />).container;
    expect(two.querySelector("polyline")).toBeInTheDocument();
    const none = render(<Sparkline data={[]} />).container;
    expect(none.querySelector("svg")).toBeInTheDocument();
    expect(none.querySelector("polyline, rect, circle")).toBeNull();
  });

  it("handles negative values with a zero baseline", () => {
    const { container } = render(<Sparkline type="bar" data={[-2, 4]} height={32} />);
    const [neg, pos] = Array.from(container.querySelectorAll("rect"));
    // The positive bar ends on the baseline where the negative bar starts.
    expect(Number(neg.getAttribute("y"))).toBeCloseTo(Number(pos.getAttribute("y")) + Number(pos.getAttribute("height")), 0);
  });

  it("ignores NaN", () => {
    const { container } = render(<Sparkline data={[1, NaN, 3, Infinity]} />);
    const points = container.querySelector("polyline")!.getAttribute("points")!;
    expect(points).not.toMatch(/NaN|Infinity/);
    expect(points.split(" ")).toHaveLength(2);
  });

  it("is an image with a label and hidden without one", () => {
    const { container, rerender } = render(<Sparkline data={[1, 2]} label="Revenue: up" />);
    expect(screen.getByRole("img", { name: "Revenue: up" })).toBeInTheDocument();
    rerender(<Sparkline data={[1, 2]} />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("svg")).not.toHaveAttribute("role");
  });

  it("maps colors to tokens", () => {
    const expected = {
      primary: "var(--rd-color-chart-1)",
      success: "var(--rd-color-feedback-success)",
      danger: "var(--rd-color-feedback-danger)",
      muted: "var(--rd-color-text-muted)",
    } as const;
    for (const [color, token] of Object.entries(expected)) {
      const { container } = render(<Sparkline data={[1, 2]} color={color as keyof typeof expected} />);
      expect(container.querySelector("polyline")).toHaveAttribute("stroke", token);
    }
  });

  it("renders on the server and passes axe", async () => {
    expect(renderToString(<Sparkline data={[1, 2, 3]} />)).toContain("polyline");
    const { container } = render(
      <>
        <Sparkline data={[1, 2, 3]} label="Trend" />
        <Sparkline data={[1, 2, 3]} type="bar" />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Sparkline: area, extremes and average", () => {
  const data = [3, 8, 2, 9, 5, 7];

  it("fills softly under the line for the area type, and not for the line type", () => {
    const area = render(<Sparkline type="area" data={data} />);
    expect(area.container.querySelectorAll("polygon")).toHaveLength(1);
    expect(area.container.querySelectorAll("polyline")).toHaveLength(1);
    expect(area.container.querySelector("polygon")).toHaveAttribute("fill-opacity", "0.16");
    area.unmount();
    const line = render(<Sparkline data={data} />);
    expect(line.container.querySelector("polygon")).toBeNull();
  });

  it("marks the lowest and highest points with rings, only when asked and only when there is a range", () => {
    const plain = render(<Sparkline data={data} showLast={false} />);
    expect(plain.container.querySelectorAll("circle")).toHaveLength(0);
    plain.unmount();
    const marked = render(<Sparkline data={data} showLast={false} showExtremes />);
    expect(marked.container.querySelectorAll("circle")).toHaveLength(2);
    marked.unmount();
    const flat = render(<Sparkline data={[4, 4, 4, 4]} showLast={false} showExtremes />);
    expect(flat.container.querySelectorAll("circle")).toHaveLength(0);
    flat.unmount();
    const two = render(<Sparkline data={[1, 5]} showLast={false} showExtremes />);
    expect(two.container.querySelectorAll("circle")).toHaveLength(0);
  });

  it("never draws two marks on the same point: the last point's dot wins over its ring", () => {
    const { container } = render(<Sparkline data={[3, 8, 2, 9]} showExtremes />);
    // highest is the last point: one dot there, plus the ring for the lowest
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });

  it("draws a dashed average line at the mean, only with at least two points", () => {
    const { container, rerender } = render(<Sparkline data={[0, 10]} height={32} showAverage />);
    const line = container.querySelector("line")!;
    expect(line).toHaveAttribute("stroke-dasharray", "2 3");
    expect(Number(line.getAttribute("y1"))).toBeCloseTo(16, 0);
    rerender(<Sparkline data={[5]} showAverage />);
    expect(container.querySelector("line")).toBeNull();
  });

  it("stays decoration without a label, whichever type", () => {
    const { container } = render(<Sparkline type="area" data={data} showExtremes showAverage />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Stat: the card look", () => {
  const reading = (c: HTMLElement) => c.querySelector(".sr-only")!.textContent ?? "";

  it("puts the trend pill at the top right, the number big, then a headline and a note", () => {
    const { container } = render(<Stat variant="card" label="Total revenue" value="$1,250.00" trend={{ change: 12.5 }} summary="Trending up this month" description="Visitors for the last 6 months" />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("rounded-2xl");
    const visible = [...card.querySelectorAll("[aria-hidden=true]")].map((n) => n.textContent);
    expect(visible.some((t) => t?.includes("Total revenue") && t.includes("+12.5%"))).toBe(true);
    expect(visible).toContain("Trending up this month");
    expect(visible).toContain("Visitors for the last 6 months");
  });

  it("reads as one sentence, with the headline included, and says the direction in words", () => {
    const { container } = render(<Stat variant="card" label="New customers" value={1234} trend={{ change: -20 }} summary="Down 20% this period" description="Acquisition needs attention" />);
    expect(reading(container)).toBe("New customers: 1,234. Down 20%. Down 20% this period. Acquisition needs attention");
  });

  it("uses a neutral bordered pill: the arrow's shape tells the direction, not a color", () => {
    const up = render(<Stat variant="card" label="A" value={1} trend={{ change: 5 }} />);
    const down = render(<Stat variant="card" label="B" value={1} trend={{ change: -5 }} />);
    const pill = (c: HTMLElement) => c.querySelector("span.rounded-full")!;
    expect(pill(up.container).className).not.toMatch(/success-subtle|danger-subtle/);
    expect(pill(up.container).querySelector("svg")!.innerHTML).not.toBe(pill(down.container).querySelector("svg")!.innerHTML);
  });

  it("keeps its frame while loading", () => {
    const { container } = render(<Stat variant="card" label="Revenue" value={1} isLoading />);
    expect((container.firstElementChild as HTMLElement).className).toContain("rounded-2xl");
    expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
  });

  it("sets big numbers in the numeric font when the page offers one, and inherits otherwise", () => {
    const { container } = render(<Stat label="Revenue" value="$48,200" />);
    expect(container.innerHTML).toContain("font-family:var(--rd-font-numeric,inherit)");
  });

  it("has no axe violations", async () => {
    const { container } = render(<Stat variant="card" label="Revenue" value="$1" trend={{ change: 3 }} summary="Up" description="d" data={[1, 2, 3]} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
