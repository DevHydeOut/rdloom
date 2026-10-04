import { parseDate } from "@internationalized/date";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Calendar,
  DatePicker,
  DateRangePicker,
  defaultDateRangePresets,
  resolvePreset,
} from "../src";
import { axeViolations } from "./axe";
import { setViewportWidth } from "./setup";

// 2026-03-01 02:00 UTC: still Feb 28 in New York, already Mar 1 in Tokyo.
const NOW = new Date("2026-03-01T02:00:00Z");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

const preset = (id: string) => defaultDateRangePresets.find((p) => p.id === id)!;
const str = (r: { start: { toString(): string }; end: { toString(): string } }) => `${r.start} → ${r.end}`;

describe("date range presets", () => {
  it("resolve against the given time zone", () => {
    expect(str(resolvePreset(preset("today"), "America/New_York"))).toBe("2026-02-28 → 2026-02-28");
    expect(str(resolvePreset(preset("today"), "Asia/Tokyo"))).toBe("2026-03-01 → 2026-03-01");
  });

  it("compute the built-in ranges", () => {
    const tz = "Asia/Tokyo";
    expect(str(resolvePreset(preset("last-7-days"), tz))).toBe("2026-02-23 → 2026-03-01");
    expect(str(resolvePreset(preset("last-30-days"), tz))).toBe("2026-01-31 → 2026-03-01");
    expect(str(resolvePreset(preset("this-month"), tz))).toBe("2026-03-01 → 2026-03-01");
    expect(str(resolvePreset(preset("last-month"), tz))).toBe("2026-02-01 → 2026-02-28");
    expect(str(resolvePreset(preset("year-to-date"), tz))).toBe("2026-01-01 → 2026-03-01");
  });
});

describe("DatePicker", () => {
  it("accepts typed dates segment by segment", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker label="Due date" onChange={onChange} />);

    const segments = within(screen.getByRole("group", { name: "Due date" })).getAllByRole("spinbutton");
    expect(segments).toHaveLength(3); // month, day, year in en-US
    await user.click(segments[0]);
    await user.keyboard("03152026");
    expect(onChange).toHaveBeenLastCalledWith(parseDate("2026-03-15"));
  });

  it("picks a date from the calendar popover and closes it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker label="Due date" defaultValue={parseDate("2026-03-15")} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /calendar/i }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /March 20, 2026/ }));

    expect(onChange).toHaveBeenCalledWith(parseDate("2026-03-20"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the calendar with Alt+ArrowDown, as the spec says", async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Due date" />);
    await user.tab();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("has no axe violations when open", async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Due date" description="When it's due" defaultValue={parseDate("2026-03-15")} />);
    await user.click(screen.getByRole("button", { name: /calendar/i }));
    expect(await axeViolations()).toEqual([]);
  });
});

describe("Calendar", () => {
  it("marks dates outside min/max as unavailable", () => {
    render(
      <Calendar
        aria-label="Booking"
        defaultValue={parseDate("2026-03-15")}
        minValue={parseDate("2026-03-10")}
        maxValue={parseDate("2026-03-20")}
      />,
    );
    expect(screen.getByRole("button", { name: /March 9, 2026/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: /March 12, 2026/ })).not.toHaveAttribute("aria-disabled");
  });

  it("shows several months with visibleMonths", () => {
    render(<Calendar aria-label="Booking" defaultValue={parseDate("2026-03-15")} visibleMonths={2} />);
    expect(screen.getAllByRole("grid")).toHaveLength(2);
  });
});

describe("DateRangePicker", () => {
  function Picker(props: Partial<React.ComponentProps<typeof DateRangePicker>>) {
    return (
      <DateRangePicker label="Period" presets={defaultDateRangePresets} timeZone="Asia/Tokyo" {...props} />
    );
  }

  it("labels the start and end fields", () => {
    render(<Picker />);
    const group = screen.getByRole("group", { name: "Period" });
    expect(within(group).getAllByRole("spinbutton")).toHaveLength(6);
  });

  it("applies a preset in the picker's time zone and closes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Picker onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /calendar/i }));
    await user.click(screen.getByRole("button", { name: "Last 7 days" }));

    const range = onChange.mock.lastCall![0];
    expect(str(range)).toBe("2026-02-23 → 2026-03-01");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("marks the active preset as pressed", async () => {
    const user = userEvent.setup();
    render(<Picker defaultValue={{ start: parseDate("2026-02-01"), end: parseDate("2026-02-28") }} />);

    await user.click(screen.getByRole("button", { name: /calendar/i }));
    expect(screen.getByRole("button", { name: "Last month" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Today" })).toHaveAttribute("aria-pressed", "false");
  });

  it("disables presets that fall outside min/max", async () => {
    const user = userEvent.setup();
    render(<Picker minValue={parseDate("2026-02-15")} />);

    await user.click(screen.getByRole("button", { name: /calendar/i }));
    expect(screen.getByRole("button", { name: "Last 30 days" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Last 7 days" })).toBeEnabled();
  });

  it("opens with Alt+ArrowDown, as the spec says", async () => {
    const user = userEvent.setup();
    render(<Picker />);
    await user.tab();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows two months by default", async () => {
    const user = userEvent.setup();
    render(<Picker />);
    await user.click(screen.getByRole("button", { name: /calendar/i }));
    expect(within(screen.getByRole("dialog")).getAllByRole("grid")).toHaveLength(2);
  });

  it("shows one month on narrow screens so the popover fits", async () => {
    setViewportWidth(375);
    const user = userEvent.setup();
    render(<Picker />);
    await user.click(screen.getByRole("button", { name: /calendar/i }));
    expect(within(screen.getByRole("dialog")).getAllByRole("grid")).toHaveLength(1);
  });

  it("has no axe violations when open", async () => {
    const user = userEvent.setup();
    render(<Picker description="Report period" />);
    await user.click(screen.getByRole("button", { name: /calendar/i }));
    expect(await axeViolations()).toEqual([]);
  });
});
