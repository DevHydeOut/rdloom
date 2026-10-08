import { parseDate } from "@internationalized/date";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Dialog, DialogTrigger, Popover } from "react-aria-components";
import { Calendar, DatePicker, RangeCalendar, Sparkline } from "../src";
import { axeViolations } from "./axe";

describe("Calendar captionLayout dropdowns", () => {
  it("has named Month and Year selects that move the visible month", async () => {
    render(<Calendar aria-label="Booking" captionLayout="dropdowns" defaultValue={parseDate("2026-03-15")} />);
    const month = screen.getByRole("button", { name: /Month/ });
    const year = screen.getByRole("button", { name: /Year/ });
    expect(month).toHaveTextContent("March");
    expect(year).toHaveTextContent("2026");
    await userEvent.click(month);
    await userEvent.click(screen.getByRole("option", { name: "July" }));
    expect(screen.getByRole("button", { name: /July 1, 2026/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Year/ }));
    await userEvent.click(screen.getByRole("option", { name: "2030" }));
    expect(screen.getByRole("button", { name: /July 1, 2030/ })).toBeInTheDocument();
  });

  it("opens the month list from the keyboard", async () => {
    render(<Calendar aria-label="Booking" captionLayout="dropdowns" defaultValue={parseDate("2026-03-15")} />);
    screen.getByRole("button", { name: /Month/ }).focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByRole("button", { name: /Month/ })).toHaveTextContent("April");
  });

  it("defaults to 50 years each side and respects min and max", async () => {
    const { unmount } = render(<Calendar aria-label="A" captionLayout="dropdowns" defaultValue={parseDate("2026-03-15")} />);
    await userEvent.click(screen.getByRole("button", { name: /Year/ }));
    expect(screen.getAllByRole("option")).toHaveLength(101);
    unmount();
    render(
      <Calendar aria-label="B" captionLayout="dropdowns" defaultValue={parseDate("2026-03-15")} minValue={parseDate("2024-01-01")} maxValue={parseDate("2027-12-31")} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Year/ }));
    expect(screen.getAllByRole("option")).toHaveLength(4);
  });

  it("keeps the next button and works in a range calendar", async () => {
    render(<RangeCalendar aria-label="Stay" captionLayout="dropdowns" defaultValue={{ start: parseDate("2026-03-10"), end: parseDate("2026-03-12") }} />);
    await userEvent.click(screen.getAllByRole("button", { name: /^next$/i })[0]);
    expect(screen.getByRole("button", { name: /Month/ })).toHaveTextContent("April");
  });

  it("has no axe violations", async () => {
    render(<Calendar aria-label="Booking" captionLayout="dropdowns" bordered defaultValue={parseDate("2026-03-15")} />);
    expect(await axeViolations()).toEqual([]);
  });

  it("bordered adds a border and the label layout has no selects", () => {
    const { container } = render(<Calendar aria-label="Booking" bordered defaultValue={parseDate("2026-03-15")} />);
    expect(container.firstElementChild?.className).toMatch(/border/);
    expect(screen.queryByRole("button", { name: /Month/ })).toBeNull();
  });

  it("still works inside a DatePicker", async () => {
    render(<DatePicker label="Day" defaultValue={parseDate("2026-03-15")} />);
    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("keeps the picker open while a month is chosen inside it", async () => {
    render(
      <DialogTrigger>
        <Button>Open</Button>
        <Popover>
          <Dialog aria-label="Pick">
            <Calendar aria-label="Day" captionLayout="dropdowns" defaultValue={parseDate("2026-03-15")} />
          </Dialog>
        </Popover>
      </DialogTrigger>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.click(screen.getByRole("button", { name: /Month/ }));
    await userEvent.click(screen.getByRole("option", { name: "May" }));
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Month/ })).toHaveTextContent("May");
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
