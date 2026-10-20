import fs from "node:fs";
import path from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Carousel, CarouselItem, CardMedia, NumberField, Sources, TimeSlotPicker } from "../src";

// Regression tests for problems found while testing the 0.3.0 upgrade.

describe("NumberField without a step", () => {
  it("keeps cents instead of snapping to a whole number", async () => {
    render(<NumberField label="Price" formatOptions={{ style: "currency", currency: "USD" }} />);
    const input = screen.getByRole("textbox", { name: /Price/ });
    await userEvent.type(input, "19.99");
    await userEvent.tab();
    expect(input).toHaveValue("$19.99");
  });

  it("still snaps to a step when one is given", async () => {
    render(<NumberField label="Seats" step={5} />);
    const input = screen.getByRole("textbox", { name: /Seats/ });
    await userEvent.type(input, "12");
    await userEvent.tab();
    expect(input).toHaveValue("10");
  });

  it("steps by 1 with the buttons when no step is given", async () => {
    render(<NumberField label="Count" defaultValue={3} />);
    await userEvent.click(screen.getByRole("button", { name: /Increase|Increment/i }));
    expect(screen.getByRole("textbox", { name: /Count/ })).toHaveValue("4");
  });
});

describe("Sources heading level", () => {
  const sources = [{ id: "a", title: "A source", url: "https://example.com/a" }];

  it("is an h4 by default, as before", () => {
    render(<Sources sources={sources} />);
    expect(screen.getByRole("heading", { level: 4, name: "Sources" })).toBeInTheDocument();
  });

  it("can be set to fit under the heading above", () => {
    render(<Sources sources={sources} headingLevel={2} />);
    expect(screen.getByRole("heading", { level: 2, name: "Sources" })).toBeInTheDocument();
  });

  it("falls back to 4 for a level that does not exist", () => {
    render(<Sources sources={sources} headingLevel={9} />);
    expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument();
  });
});

describe("CardMedia with an empty alt", () => {
  it("is treated as decorative, not exposed as a nameless image", () => {
    const { container } = render(<CardMedia alt="" style={{ background: "red" }} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("an img with an empty alt is left empty", () => {
    const { container } = render(<CardMedia src="/a.jpg" alt="  " />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("keeps real alt text", () => {
    render(<CardMedia alt="Gradient sky" style={{ background: "red" }} />);
    expect(screen.getByRole("img", { name: "Gradient sky" })).toBeInTheDocument();
  });
});

describe("TimeSlotPicker refresh", () => {
  const free = (date: string) => [{ time: `${date}T09:30`, available: true }];

  it("loads the day again when refreshKey changes", async () => {
    const getSlots = vi.fn(async (d: string) => free(d));
    const { rerender } = render(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={getSlots} refreshKey={1} />);
    await screen.findAllByRole("radio");
    expect(getSlots).toHaveBeenCalledTimes(1);
    rerender(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={getSlots} refreshKey={2} />);
    await waitFor(() => expect(getSlots).toHaveBeenCalledTimes(2));
  });

  it("shows the booked slot as taken after onSelect succeeds", async () => {
    let booked = false;
    const getSlots = async (d: string) => [{ time: `${d}T09:30`, available: !booked, reason: "Booked" }, { time: `${d}T10:00`, available: true }];
    render(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={getSlots} onSelect={() => void (booked = true)} />);
    await userEvent.click(await screen.findByRole("radio", { name: "9:30 AM" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(screen.getByRole("radio", { name: /9:30 AM.*unavailable/ })).toBeDisabled());
  });

  it("does not reload when onSelect fails", async () => {
    const getSlots = vi.fn(async (d: string) => free(d));
    const onSelect = vi.fn(async () => {
      throw new Error("conflict");
    });
    render(<TimeSlotPicker locale="en-US" today="2026-10-08" getSlots={getSlots} onSelect={onSelect} />);
    await userEvent.click(await screen.findByRole("radio", { name: "9:30 AM" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    expect(getSlots).toHaveBeenCalledTimes(1);
  });
});

describe("Backlight and reduced motion", () => {
  // jsdom has no layout, so check the stylesheet itself: a rule that turns the animation off must be at least
  // as specific as the rules that turn it on, or the animation keeps running.
  const css = fs.readFileSync(path.resolve(__dirname, "../src/motion/rdloom-motion.css"), "utf8");
  const stillRules = (scope: RegExp) => [...css.matchAll(scope)].map((m) => m[0]).join("\n");

  it("stops both glow modes under prefers-reduced-motion", () => {
    const block = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(block).toMatch(/\.rdm-backlight-glow\[data-mode\]/);
  });

  it("stops both glow modes inside .rdm-still", () => {
    expect(stillRules(/\.rdm-still \.rdm-backlight-glow\[data-mode\]/g)).not.toBe("");
  });
});

describe("Carousel keyboard access", () => {
  it("makes the scrolling area the one tab stop, and arrow keys work from it", async () => {
    render(
      <Carousel label="Stories">
        <CarouselItem>One</CarouselItem>
        <CarouselItem>Two</CarouselItem>
      </Carousel>,
    );
    const region = screen.getByRole("region", { name: "Stories" });
    expect(region).not.toHaveAttribute("tabindex");
    const viewport = region.querySelector("[tabindex='0']") as HTMLElement;
    expect(viewport).not.toBeNull();
    expect(viewport.className).toContain("overflow-x-auto");
    viewport.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("group", { name: "2 of 2" })).toBeInTheDocument();
  });
});
