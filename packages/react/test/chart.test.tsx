import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Chart } from "../src/chart/chart";
import { niceRange, percentages } from "../src/chart/scales";
import { axeViolations } from "./axe";

const data = {
  labels: ["Jan", "Feb", "Mar"],
  series: [
    { name: "Revenue", values: [21000, 26500, 31000] },
    { name: "Cost", values: [14000, 12000, 15500] },
  ],
  unit: "$",
};
const one = { labels: ["Jan", "Feb", "Mar", "Apr"], series: [{ name: "Visits", values: [50, 30, 15, 5] }] };
const types = ["bar", "line", "area", "donut"] as const;

const marks = (container: HTMLElement, kind: string) => container.querySelectorAll(`[data-mark="${kind}"]`);
const plot = () => screen.getByRole("group", { name: /arrow keys/ });
const status = () => screen.getAllByRole("status")[0];

afterEach(() => vi.unstubAllGlobals());

describe("Chart marks", () => {
  it("draws one bar per value", () => {
    const { container } = render(<Chart title="T" data={data} />);
    expect(marks(container, "bar")).toHaveLength(6);
  });

  it("draws a line and a marker per value", () => {
    const { container } = render(<Chart title="T" type="line" data={data} />);
    expect(marks(container, "line")).toHaveLength(2);
    expect(marks(container, "point")).toHaveLength(6);
  });

  it("draws an area per series", () => {
    const { container } = render(<Chart title="T" type="area" data={data} />);
    expect(marks(container, "area")).toHaveLength(2);
  });

  it("draws one slice per value, separated by a gap", () => {
    const { container } = render(<Chart title="T" type="donut" data={one} />);
    expect(marks(container, "slice")).toHaveLength(4);
  });

  it("stacks bars so the top edge is the total", () => {
    const { container } = render(<Chart title="T" stacked data={data} height={300} />);
    const bars = [...marks(container, "bar")];
    const first = bars[0].getAttribute("y")!;
    const second = bars[3].getAttribute("y")!;
    const h1 = Number(bars[0].getAttribute("height"));
    const h2 = Number(bars[3].getAttribute("height"));
    expect(Number(second) + h2).toBeCloseTo(Number(first), 5);
    expect(h1).toBeGreaterThan(h2 * 0 + 0);
    expect(container.querySelectorAll('[data-label="total"]')).toHaveLength(3);
    expect(container.querySelector('[data-label="total"]')!.textContent).toMatch(/^\$35k$/i);
  });

  it("draws negative values below the zero line", () => {
    const { container } = render(<Chart title="T" data={{ labels: ["A", "B"], series: [{ name: "Net", values: [40, -20] }] }} />);
    const [up, down] = [...marks(container, "bar")];
    expect(Number(up.getAttribute("y")) + Number(up.getAttribute("height"))).toBeCloseTo(Number(down.getAttribute("y")), 5);
    expect(Number(down.getAttribute("height"))).toBeGreaterThan(0);
    const ticks = [...container.querySelectorAll('[data-axis="y"]')].map((t) => t.textContent);
    expect(ticks.some((t) => t!.includes("-") || t!.includes("−"))).toBe(true);
  });

  it("labels bars directly when there are few", () => {
    const { container } = render(<Chart title="T" data={one} />);
    expect(container.querySelectorAll('[data-label="value"]')).toHaveLength(4);
  });

  it("uses chart tokens for color and never hard-codes it", () => {
    const { container } = render(<Chart title="T" data={data} />);
    const fills = [...marks(container, "bar")].map((m) => m.getAttribute("fill"));
    expect(fills[0]).toBe("var(--rd-color-chart-1)");
    expect(fills[3]).toBe("var(--rd-color-chart-2)");
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });
});

describe("Chart legend and summary", () => {
  it("names each series with a different marker shape", () => {
    const { container } = render(<Chart title="T" type="line" data={{ labels: ["a", "b"], series: [1, 2, 3, 4, 5, 6].map((i) => ({ name: `S${i}`, values: [i, i + 1] })) }} />);
    const legend = screen.getByRole("list", { name: "Legend" });
    expect(within(legend).getAllByRole("listitem")).toHaveLength(6);
    const shapes = [...legend.querySelectorAll("[data-shape]")].map((s) => s.getAttribute("data-shape"));
    expect(new Set(shapes).size).toBe(6);
    expect(container.querySelectorAll("[data-shape]").length).toBeGreaterThan(6);
  });

  it("hides the legend for a single series and when asked", () => {
    const { rerender } = render(<Chart title="T" data={one} />);
    expect(screen.queryByRole("list", { name: "Legend" })).toBeNull();
    rerender(<Chart title="T" data={data} showLegend={false} />);
    expect(screen.queryByRole("list", { name: "Legend" })).toBeNull();
  });

  it("writes a default summary from the data and accepts one", () => {
    const { rerender } = render(<Chart title="T" data={data} />);
    expect(screen.getByText(/Bar chart of Revenue, Cost across 3 points\. Revenue is highest at \$31,000 \(Mar\) and lowest at \$21,000 \(Jan\)/)).toBeInTheDocument();
    rerender(<Chart title="T" data={data} summary="Revenue is up." />);
    expect(screen.getByText("Revenue is up.")).toBeInTheDocument();
  });

  it("can hide grid lines but keeps the zero line", () => {
    const { container } = render(<Chart title="T" data={data} showGrid={false} />);
    expect(container.querySelectorAll("line")).toHaveLength(1);
  });

  it("is a figure named by its title", () => {
    render(<Chart title="Revenue" data={data} />);
    expect(screen.getByRole("figure", { name: "Revenue" })).toBeInTheDocument();
  });
});

describe("Chart donut", () => {
  it("shows percentages that add up to 100 and the total in the middle", () => {
    const { container } = render(<Chart title="T" type="donut" data={{ labels: ["a", "b", "c"], series: [{ name: "V", values: [1, 1, 1] }] }} />);
    const legend = screen.getByRole("list", { name: "Legend" });
    const sum = within(legend)
      .getAllByRole("listitem")
      .map((li) => Number(li.textContent!.match(/(\d+)%/)![1]))
      .reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
    expect(container.querySelector("[data-total]")!.textContent).toBe("3");
  });

  it("keeps the legend with a single series, and draws only the first series", () => {
    const { container } = render(<Chart title="T" type="donut" data={data} />);
    expect(screen.getByRole("list", { name: "Legend" })).toBeInTheDocument();
    expect(marks(container, "slice")).toHaveLength(3);
  });

  it("copes with all-zero data", () => {
    const { container } = render(<Chart title="T" type="donut" data={{ labels: ["a", "b"], series: [{ name: "V", values: [0, 0] }] }} />);
    expect(marks(container, "slice")).toHaveLength(0);
    expect(marks(container, "empty-ring")).toHaveLength(1);
    expect(container.querySelector("[data-total]")!.textContent).toBe("0");
  });

  it("percentages helper adds up", () => {
    expect(percentages([1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(100);
    expect(percentages([0, 0])).toEqual([0, 0]);
  });
});

describe("Chart table", () => {
  it("swaps the drawing for a table with the same numbers", async () => {
    const user = userEvent.setup();
    const { container } = render(<Chart title="Revenue" data={data} />);
    const toggle = screen.getByRole("button", { name: "View as table" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "View as chart" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector("svg[width]")).toBeNull();
    const table = screen.getByRole("table", { name: "Revenue" });
    expect(within(table).getByRole("rowheader", { name: "Feb" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "$26,500" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Cost" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /data table/ })).toHaveAttribute("tabindex", "0");
    await user.click(screen.getByRole("button", { name: "View as chart" }));
    expect(screen.getByRole("group", { name: /arrow keys/ })).toBeInTheDocument();
  });

  it("uses valueFormat in the table, the tooltip and the axis", async () => {
    const user = userEvent.setup();
    const fmt = (v: number) => `<${v}>`;
    const { container } = render(<Chart title="T" data={data} valueFormat={fmt} />);
    expect(container.querySelector('[data-axis="y"]')!.textContent).toMatch(/^<-?\d+>$/);
    fireEvent.mouseMove(plot(), { clientX: 100, clientY: 50 });
    expect(container.querySelector('[data-slot="tooltip"]')!.textContent).toContain("<21000>");
    await user.click(screen.getByRole("button", { name: "View as table" }));
    expect(screen.getByRole("cell", { name: "<26500>" })).toBeInTheDocument();
  });
});

describe("Chart keyboard", () => {
  it("moves with the arrow keys, Home and End, and announces the value", async () => {
    const user = userEvent.setup();
    render(<Chart title="T" data={data} />);
    await user.tab();
    await user.tab();
    expect(plot()).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(status()).toHaveTextContent("Jan: Revenue $21,000, Cost $14,000");
    await user.keyboard("{ArrowRight}");
    expect(status()).toHaveTextContent("Feb: Revenue $26,500, Cost $12,000");
    await user.keyboard("{End}");
    expect(status()).toHaveTextContent("Mar: Revenue $31,000, Cost $15,500");
    await user.keyboard("{ArrowRight}");
    expect(status()).toHaveTextContent("Mar:");
    await user.keyboard("{Home}");
    expect(status()).toHaveTextContent("Jan:");
    await user.keyboard("{ArrowLeft}");
    expect(status()).toHaveTextContent("Jan:");
    await user.keyboard("{Escape}");
    expect(status()).toBeEmptyDOMElement();
  });

  it("is one tab stop and describes itself", () => {
    render(<Chart title="Revenue" summary="Up." data={data} />);
    expect(plot()).toHaveAttribute("aria-label", "Revenue. Use the left and right arrow keys to move between values.");
    expect(plot().getAttribute("aria-describedby")).toBeTruthy();
    expect(document.getElementById(plot().getAttribute("aria-describedby")!)).toHaveTextContent("Up.");
    expect(plot().querySelectorAll("[tabindex]")).toHaveLength(0);
  });

  it("calls onSelect with the active point on Enter and Space", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Chart title="T" data={data} onSelect={onSelect} />);
    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
    await user.keyboard("{ArrowRight}{ArrowRight}{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith({ index: 1, label: "Feb", series: "Revenue", value: 26500 });
    await user.keyboard(" ");
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("moves between donut slices with up and down", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Chart title="T" type="donut" data={one} onSelect={onSelect} />);
    await user.tab();
    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(status()).toHaveTextContent("Feb: 30, 30%");
    await user.keyboard("{ArrowUp}{Enter}");
    expect(onSelect).toHaveBeenCalledWith({ index: 0, label: "Jan", series: "Visits", value: 50 });
  });
});

describe("Chart pointer", () => {
  it("shows a tooltip with every series for the category under the pointer", () => {
    const { container } = render(<Chart title="T" data={data} />);
    expect(container.querySelector('[data-slot="tooltip"]')).toBeNull();
    fireEvent.mouseMove(plot(), { clientX: 330, clientY: 60 });
    const tip = container.querySelector('[data-slot="tooltip"]')!;
    expect(tip).toHaveAttribute("role", "presentation");
    expect(tip.textContent).toContain("Feb");
    expect(tip.textContent).toContain("Revenue");
    expect(tip.textContent).toContain("$26,500");
    expect(tip.textContent).toContain("Cost");
    expect(tip.textContent).toContain("$12,000");
    expect(status()).toBeEmptyDOMElement();
    fireEvent.mouseLeave(plot());
    expect(container.querySelector('[data-slot="tooltip"]')).toBeNull();
  });

  it("shows a slice in a tooltip with its percentage", () => {
    const { container } = render(<Chart title="T" type="donut" data={one} />);
    fireEvent.mouseMove(marks(container, "slice")[0], { clientX: 300, clientY: 100 });
    expect(container.querySelector('[data-slot="tooltip"]')!.textContent).toContain("50%");
  });

  it("keeps the tooltip inside the chart", () => {
    const { container } = render(<Chart title="T" data={data} />);
    fireEvent.mouseMove(plot(), { clientX: 630, clientY: 270 });
    const tip = container.querySelector<HTMLElement>('[data-slot="tooltip"]')!;
    expect(Number.parseFloat(tip.style.left) + 176).toBeLessThanOrEqual(640);
    expect(Number.parseFloat(tip.style.top)).toBeLessThanOrEqual(280);
  });

  it("calls onSelect when a bar is clicked", () => {
    const onSelect = vi.fn();
    render(<Chart title="T" data={data} onSelect={onSelect} />);
    fireEvent.click(plot(), { clientX: 330, clientY: 60 });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toMatchObject({ index: 1, label: "Feb" });
  });
});

describe("Chart states", () => {
  it("shows a skeleton while loading, with no axes or numbers", () => {
    const { container } = render(<Chart title="T" data={data} isLoading />);
    expect(screen.getByRole("figure")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Loading chart");
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the empty message", () => {
    const { container, rerender } = render(<Chart title="T" data={{ labels: [], series: [] }} />);
    expect(screen.getByText("No data to chart.")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
    rerender(<Chart title="T" data={{ labels: ["a"], series: [] }} emptyMessage="Nothing yet." />);
    expect(screen.getByText("Nothing yet.")).toBeInTheDocument();
  });

  it("copes with a single data point", () => {
    const { container } = render(<Chart title="T" type="line" data={{ labels: ["Only"], series: [{ name: "V", values: [7] }] }} />);
    expect(marks(container, "point")).toHaveLength(1);
    expect(screen.getByText(/1 point\./)).toBeInTheDocument();
  });

  it("copes with all-zero data", () => {
    const { container } = render(<Chart title="T" data={{ labels: ["a", "b"], series: [{ name: "V", values: [0, 0] }] }} />);
    expect(marks(container, "bar")).toHaveLength(2);
    expect(container.innerHTML).not.toContain("NaN");
  });

  it("formats decimals", async () => {
    const user = userEvent.setup();
    render(<Chart title="T" data={{ labels: ["a"], series: [{ name: "V", values: [0.125] }] }} />);
    await user.click(screen.getByRole("button", { name: "View as table" }));
    expect(screen.getByRole("cell", { name: "0.125" })).toBeInTheDocument();
  });

  it("thins and truncates a very long list of labels without throwing", () => {
    const labels = Array.from({ length: 400 }, (_, i) => `A rather long category name ${i}`);
    const values = labels.map((_, i) => i);
    for (const type of types) {
      const { container, unmount } = render(<Chart title="T" type={type} data={{ labels, series: [{ name: "V", values }] }} />);
      if (type !== "donut") {
        const shown = container.querySelectorAll('[data-axis="x"]');
        expect(shown.length).toBeLessThan(20);
        expect(shown[0].textContent!.length).toBeLessThan(30);
      }
      unmount();
    }
  });
});

describe("Chart sizing", () => {
  it("falls back to 640 without ResizeObserver", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const { container } = render(<Chart title="T" data={data} />);
    expect(container.querySelector("svg[width]")).toHaveAttribute("width", "640");
  });

  it("redraws at the measured width when the container resizes", () => {
    let callback: () => void = () => {};
    let width = 500;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    const spy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ width, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON() {} }));
    const { container } = render(<Chart title="T" data={data} />);
    expect(container.querySelector("svg[width]")).toHaveAttribute("width", "500");
    width = 320;
    act(() => callback());
    expect(container.querySelector("svg[width]")).toHaveAttribute("width", "320");
    spy.mockRestore();
  });

  it("uses the height prop", () => {
    const { container } = render(<Chart title="T" data={data} height={200} />);
    expect(container.querySelector("svg[width]")).toHaveAttribute("height", "200");
  });
});

describe("Chart on the server", () => {
  it.each(types)("renders %s to a string", (type) => {
    const html = renderToString(<Chart title="Revenue" type={type} data={data} />);
    expect(html).toContain("Revenue");
    expect(html).toContain("<svg");
  });

  it("renders loading and empty to a string", () => {
    expect(renderToString(<Chart title="T" data={data} isLoading />)).toContain("Loading chart");
    expect(renderToString(<Chart title="T" data={{ labels: [], series: [] }} />)).toContain("No data to chart.");
  });
});

describe("niceRange", () => {
  it("includes zero and rounds the ends", () => {
    expect(niceRange(0, 31000)).toMatchObject({ min: 0, max: 40000 });
    const r = niceRange(-20, 40);
    expect(r.min).toBeLessThanOrEqual(-20);
    expect(r.ticks).toContain(0);
    expect(niceRange(0, 0)).toEqual({ min: 0, max: 1, ticks: [0, 1] });
  });
});

describe("Chart accessibility", () => {
  it.each(types)("has no axe violations for %s", async (type) => {
    const { container } = render(<Chart title="Revenue" type={type} data={data} />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it.each(types)("has no axe violations for %s with the tooltip open", async (type) => {
    const { container } = render(<Chart title="Revenue" type={type} data={data} />);
    if (type === "donut") fireEvent.mouseMove(marks(container, "slice")[0], { clientX: 300, clientY: 100 });
    else fireEvent.mouseMove(plot(), { clientX: 330, clientY: 60 });
    expect(container.querySelector('[data-slot="tooltip"]')).not.toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("has no axe violations in the table, loading and empty states", async () => {
    const user = userEvent.setup();
    const a = render(<Chart title="T" data={data} />);
    await user.click(screen.getByRole("button", { name: "View as table" }));
    expect(await axeViolations(a.container)).toEqual([]);
    a.unmount();
    const b = render(<Chart title="T" data={data} isLoading />);
    expect(await axeViolations(b.container)).toEqual([]);
    b.unmount();
    const c = render(<Chart title="T" data={{ labels: [], series: [] }} />);
    expect(await axeViolations(c.container)).toEqual([]);
  });

  it("has no axe violations when stacked", async () => {
    const { container } = render(<Chart title="T" stacked data={data} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
