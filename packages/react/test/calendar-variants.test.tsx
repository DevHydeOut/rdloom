import { parseDate } from "@internationalized/date";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar, DatePicker, RangeCalendar, Sparkline } from "../src";
import { axeViolations } from "./axe";

describe("Calendar captionLayout dropdowns", () => {
  it("has named Month and Year selects that move the visible month", async () => {
    render(<Calendar aria-label="Booking" captionLayout="dropdowns" defaultValue={parseDate("2026-03-15")} />);
    const month = screen.getByRole("combobox", { name: "Month" });
    const year = screen.getByRole("combobox", { name: "Year" });
    expect(month).toHaveValue("3");
    expect(year).toHaveValue("2026");
    await userEvent.selectOptions(month, "7");
    expect(screen.getByRole("button", { name: /July 1, 2026/ })).toBeInTheDocument();
    await userEvent.selectOptions(year, "2030");
    expect(screen.getByRole("button", { name: /July 1, 2030/ })).toBeInTheDocument();
  });

  it("defaults to 50 years each side and respects min and max", () => {
    const { unmount } = render(<Calendar aria-label="A" captionLayout="dropdowns" defaultValue={parseDate("2026-03-15")} />);
    expect(screen.getByRole("combobox", { name: "Year" }).querySelectorAll("option")).toHaveLength(101);
    unmount();
    render(
      <Calendar aria-label="B" captionLayout="dropdowns" defaultValue={parseDate("2026-03-15")} minValue={parseDate("2024-01-01")} maxValue={parseDate("2027-12-31")} />,
    );
    expect(screen.getByRole("combobox", { name: "Year" }).querySelectorAll("option")).toHaveLength(4);
  });

  it("keeps the next button and works in a range calendar", async () => {
    render(<RangeCalendar aria-label="Stay" captionLayout="dropdowns" defaultValue={{ start: parseDate("2026-03-10"), end: parseDate("2026-03-12") }} />);
    await userEvent.click(screen.getAllByRole("button", { name: /^next$/i })[0]);
    expect(screen.getByRole("combobox", { name: "Month" })).toHaveValue("4");
  });

  it("has no axe violations", async () => {
    render(<Calendar aria-label="Booking" captionLayout="dropdowns" bordered defaultValue={parseDate("2026-03-15")} />);
    expect(await axeViolations()).toEqual([]);
  });

  it("bordered adds a border and the label layout has no selects", () => {
    const { container } = render(<Calendar aria-label="Booking" bordered defaultValue={parseDate("2026-03-15")} />);
    expect(container.firstElementChild?.className).toMatch(/border/);
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("still works inside a DatePicker", async () => {
    render(<DatePicker label="Day" defaultValue={parseDate("2026-03-15")} />);
    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });
});

describe("Sparkline responsive", () => {
  it("fills its parent and keeps the viewBox", () => {
    const { container } = render(<Sparkline responsive width={576} height={96} data={[1, 3, 2]} />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("width", "100%");
    expect(svg).toHaveAttribute("viewBox", "0 0 576 96");
  });
});
