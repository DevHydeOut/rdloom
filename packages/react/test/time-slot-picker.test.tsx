import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TimeSlotPicker } from "../src";
import { axeViolations } from "./axe";

const slotsFor = (date: string) => [
  { time: `${date}T09:00`, available: false, reason: "Already booked" },
  { time: `${date}T09:30`, available: true },
  { time: `${date}T10:00`, available: true },
];

describe("TimeSlotPicker", () => {
  it("lists the slots of the chosen date as a radio group", async () => {
    const getSlots = vi.fn(slotsFor);
    render(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={getSlots} />);
    expect(await screen.findByRole("radiogroup", { name: /Available times for/ })).toBeInTheDocument();
    expect(getSlots).toHaveBeenCalledWith("2026-10-08");
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "9:30 AM" })).toBeInTheDocument();
  });

  it("disables a taken slot and puts its reason in the name", async () => {
    render(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={slotsFor} />);
    const taken = await screen.findByRole("radio", { name: /9:00 AM.*unavailable.*Already booked/ });
    expect(taken).toBeDisabled();
  });

  it("keeps Confirm disabled until a time is chosen, then returns the date and slot", async () => {
    const onSelect = vi.fn();
    render(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={slotsFor} onSelect={onSelect} />);
    const confirm = screen.getByRole("button", { name: "Confirm" });
    await screen.findAllByRole("radio");
    expect(confirm).toBeDisabled();
    await userEvent.click(screen.getByRole("radio", { name: "10:00 AM" }));
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith({ date: "2026-10-08", slot: { time: "2026-10-08T10:00", available: true } }));
  });

  it("moves between times with the arrow keys", async () => {
    render(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={slotsFor} />);
    await screen.findAllByRole("radio");
    await userEvent.click(screen.getByRole("radio", { name: "9:30 AM" }));
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "10:00 AM" })).toBeChecked();
  });

  it("loads again when the date changes and clears the choice", async () => {
    const getSlots = vi.fn(slotsFor);
    const onDateChange = vi.fn();
    render(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={getSlots} onDateChange={onDateChange} />);
    await userEvent.click(await screen.findByRole("radio", { name: "10:00 AM" }));
    await userEvent.click(screen.getByRole("button", { name: /October 12/ }));
    await waitFor(() => expect(getSlots).toHaveBeenLastCalledWith("2026-10-12"));
    expect(onDateChange).toHaveBeenCalledWith("2026-10-12");
    await screen.findAllByRole("radio");
    expect(screen.getByRole("radio", { name: "10:00 AM" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("does not offer dates before minDate", () => {
    render(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={slotsFor} />);
    expect(screen.getByRole("button", { name: /October 7/ })).toHaveAttribute("aria-disabled", "true");
  });

  it("waits for async slots and says it is loading", async () => {
    let resolve!: (v: ReturnType<typeof slotsFor>) => void;
    const getSlots = () => new Promise<ReturnType<typeof slotsFor>>((r) => (resolve = r));
    const { container } = render(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={getSlots} />);
    expect(container.querySelector("[aria-busy=true]")).not.toBeNull();
    expect(screen.getByText("Loading times")).toBeInTheDocument();
    resolve(slotsFor("2026-10-08"));
    expect(await screen.findAllByRole("radio")).toHaveLength(3);
  });

  it("says when there are no times left", async () => {
    render(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={() => []} />);
    expect(await screen.findByText("No times left on this day")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("shows an error with Try again", async () => {
    const getSlots = vi.fn().mockRejectedValueOnce(new Error("no")).mockResolvedValue(slotsFor("2026-10-08"));
    render(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={getSlots} />);
    await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findAllByRole("radio")).toHaveLength(3);
  });

  it("shows the time zone label and formats offset times in it", async () => {
    render(<TimeSlotPicker locale="en-US" today="2026-10-08" timeZone="Europe/Berlin" getSlots={(d) => [{ time: `${d}T09:00:00Z`, available: true }]} />);
    expect(await screen.findByRole("radio", { name: "11:00 AM" })).toBeInTheDocument();
    expect(screen.getByText(/Times shown in/)).toHaveTextContent("Europe/Berlin");
  });

  it("respects the confirm permission", async () => {
    const onSelect = vi.fn();
    render(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={slotsFor} onSelect={onSelect} permissions={{ confirm: { state: "disabled", reason: "Sign in to book" } }} />);
    await userEvent.click(await screen.findByRole("radio", { name: "10:00 AM" }));
    const confirm = screen.getByRole("button", { name: /Confirm/ });
    expect(confirm).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(confirm);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("applies classNames and a confirm label", async () => {
    render(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={slotsFor} confirmLabel="Book" classNames={{ slot: "my-slot" }} />);
    const radio = await screen.findByRole("radio", { name: "9:30 AM" });
    expect(radio.closest("label")?.className).toContain("my-slot");
    expect(screen.getByRole("button", { name: "Book" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<TimeSlotPicker locale="en-US" today="2026-10-08" timeZone="Europe/Berlin" getSlots={slotsFor} />);
    await screen.findAllByRole("radio");
    expect(await axeViolations(container)).toEqual([]);
  });
});
