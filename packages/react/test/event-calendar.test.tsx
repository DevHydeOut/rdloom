import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EventCalendar, type EventCalendarEvent } from "../src";
import { axeViolations } from "./axe";

const events: EventCalendarEvent[] = [
  { id: "1", title: "Design review", start: "2026-10-06T10:00", tone: "info" },
  { id: "2", title: "Planning", start: "2026-10-12T09:30" },
  { id: "3", title: "Vendor call", start: "2026-10-12T13:00" },
  { id: "4", title: "Budget sync", start: "2026-10-12T15:30" },
  { id: "5", title: "Retro", start: "2026-10-12T16:30" },
  { id: "6", title: "Offsite", start: "2026-10-20", end: "2026-10-21", allDay: true },
];

const base = { events, defaultMonth: "2026-10", today: "2026-10-08", locale: "en-US" } as const;
const cell = (date: string) => document.querySelector<HTMLElement>(`[data-date="${date}"]`)!;

describe("EventCalendar", () => {
  it("is a grid with weekday headers and a heading for the month", () => {
    render(<EventCalendar {...base} />);
    expect(screen.getByRole("grid", { name: "Calendar, October 2026" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
    expect(screen.getByRole("heading", { name: "October 2026" })).toBeInTheDocument();
  });

  it("names each day with its date and event count", () => {
    render(<EventCalendar {...base} />);
    expect(cell("2026-10-12")).toHaveAccessibleName("Monday, October 12, 2026, 4 events");
    expect(cell("2026-10-06")).toHaveAccessibleName("Tuesday, October 6, 2026, 1 event");
    expect(cell("2026-10-08")).toHaveAccessibleName(expect.stringContaining("today"));
  });

  it("shows three events and a +N more button that lists the rest", async () => {
    const onEventSelect = vi.fn();
    render(<EventCalendar {...base} onEventSelect={onEventSelect} />);
    const day = within(cell("2026-10-12"));
    expect(day.getByRole("button", { name: /Planning/ })).toBeInTheDocument();
    expect(day.queryByRole("button", { name: /Retro/ })).toBeNull();
    await userEvent.click(day.getByRole("button", { name: "1 more event on October 12" }));
    const list = await screen.findByRole("dialog", { name: "Events on October 12" });
    expect(within(list).getAllByRole("button")).toHaveLength(4);
    await userEvent.click(within(list).getByRole("button", { name: /Retro/ }));
    expect(onEventSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "5" }));
  });

  it("puts a multi-day event on each day it covers", () => {
    render(<EventCalendar {...base} />);
    expect(within(cell("2026-10-20")).getByRole("button", { name: /Offsite/ })).toBeInTheDocument();
    expect(within(cell("2026-10-21")).getByRole("button", { name: /Offsite/ })).toBeInTheDocument();
  });

  it("has one tab stop and moves it with the arrow keys", async () => {
    render(<EventCalendar {...base} />);
    expect(document.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);
    cell("2026-10-08").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(cell("2026-10-09")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(cell("2026-10-16")).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}{ArrowUp}");
    expect(cell("2026-10-08")).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(cell("2026-10-04")).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(cell("2026-10-10")).toHaveFocus();
  });

  it("changes month with Page Down, the buttons and Today, and reports it", async () => {
    const onMonthChange = vi.fn();
    render(<EventCalendar {...base} onMonthChange={onMonthChange} />);
    cell("2026-10-08").focus();
    await userEvent.keyboard("{PageDown}");
    expect(onMonthChange).toHaveBeenLastCalledWith("2026-11");
    expect(screen.getByRole("heading", { name: "November 2026" })).toBeInTheDocument();
    expect(cell("2026-11-08")).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(onMonthChange).toHaveBeenLastCalledWith("2026-10");
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    await userEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(screen.getByRole("heading", { name: "October 2026" })).toBeInTheDocument();
  });

  it("moves across a month edge with the arrow keys", async () => {
    render(<EventCalendar {...base} />);
    cell("2026-10-31").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("heading", { name: "November 2026" })).toBeInTheDocument();
    expect(cell("2026-11-01")).toHaveFocus();
  });

  it("can be controlled by month", () => {
    const { rerender } = render(<EventCalendar {...base} month="2026-12" />);
    expect(screen.getByRole("heading", { name: "December 2026" })).toBeInTheDocument();
    rerender(<EventCalendar {...base} month="2027-01" />);
    expect(screen.getByRole("heading", { name: "January 2027" })).toBeInTheDocument();
  });

  it("starts the week on weekStartsOn", () => {
    render(<EventCalendar {...base} weekStartsOn={1} />);
    expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName("Monday");
  });

  it("uses the locale for names", () => {
    render(<EventCalendar {...base} locale="de-DE" weekStartsOn={1} />);
    expect(screen.getByRole("heading", { name: "Oktober 2026" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName("Montag");
  });

  it("calls onDateSelect on click and on Enter", async () => {
    const onDateSelect = vi.fn();
    render(<EventCalendar {...base} onDateSelect={onDateSelect} />);
    await userEvent.click(cell("2026-10-14"));
    expect(onDateSelect).toHaveBeenLastCalledWith("2026-10-14");
    cell("2026-10-15").focus();
    await userEvent.keyboard("{Enter}");
    expect(onDateSelect).toHaveBeenLastCalledWith("2026-10-15");
  });

  it("calls onEventSelect for an event", async () => {
    const onEventSelect = vi.fn();
    render(<EventCalendar {...base} onEventSelect={onEventSelect} />);
    await userEvent.click(screen.getByRole("button", { name: /Design review/ }));
    expect(onEventSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }));
  });

  it("creates from a day when allowed", async () => {
    const onCreate = vi.fn();
    render(<EventCalendar {...base} onCreate={onCreate} />);
    await userEvent.click(within(cell("2026-10-09")).getByRole("button", { name: "Add event on October 9" }));
    expect(onCreate).toHaveBeenCalledWith("2026-10-09");
  });

  it("has no add buttons without onCreate or when hidden", () => {
    const { rerender } = render(<EventCalendar {...base} />);
    expect(screen.queryByRole("button", { name: /Add event/ })).toBeNull();
    rerender(<EventCalendar {...base} onCreate={() => {}} permissions={{ create: "hidden" }} />);
    expect(screen.queryByRole("button", { name: /Add event/ })).toBeNull();
  });

  it("keeps a disabled add button reachable, says why and does nothing", async () => {
    const onCreate = vi.fn();
    render(<EventCalendar {...base} onCreate={onCreate} permissions={{ create: { state: "disabled", reason: "Read only" } }} />);
    const add = within(cell("2026-10-09")).getByRole("button", { name: "Add event on October 9. Read only" });
    expect(add).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(add);
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("shows loading, empty and error states", async () => {
    const onRetry = vi.fn();
    const { rerender, container } = render(<EventCalendar {...base} state="loading" />);
    expect(container.querySelector("[aria-busy=true]")).not.toBeNull();
    expect(screen.queryByRole("grid")).toBeNull();
    rerender(<EventCalendar {...base} state="empty" />);
    expect(screen.getByText("No events this month")).toBeInTheDocument();
    rerender(<EventCalendar {...base} state="error" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("applies classNames", () => {
    render(<EventCalendar {...base} classNames={{ day: "my-day", event: "my-event" }} />);
    expect(cell("2026-10-08").className).toContain("my-day");
    expect(screen.getByRole("button", { name: /Design review/ }).className).toContain("my-event");
  });

  it("has no axe violations", async () => {
    const { container } = render(<EventCalendar {...base} onCreate={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
