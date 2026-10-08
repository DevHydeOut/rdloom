import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ScrollArea } from "../src";
import { axeViolations } from "./axe";

function sized(el: HTMLElement, m: { scrollHeight: number; clientHeight: number; scrollTop?: number }) {
  Object.defineProperty(el, "scrollHeight", { configurable: true, value: m.scrollHeight });
  Object.defineProperty(el, "clientHeight", { configurable: true, value: m.clientHeight });
  el.scrollTop = m.scrollTop ?? 0;
}

const maskOf = (el: HTMLElement) => el.style.maskImage || el.style.getPropertyValue("-webkit-mask-image") || "";

describe("ScrollArea", () => {
  it("is a focusable, named region", async () => {
    const user = userEvent.setup();
    render(<ScrollArea label="Recent items">content</ScrollArea>);
    const region = screen.getByRole("region", { name: "Recent items" });
    expect(region).toHaveAttribute("tabindex", "0");
    await user.tab();
    expect(region).toHaveFocus();
  });

  it("sets overflow for each orientation", () => {
    const { rerender } = render(<ScrollArea label="A">x</ScrollArea>);
    const region = screen.getByRole("region");
    expect(region.className).toContain("overflow-y-auto");
    expect(region.className).toContain("overflow-x-hidden");
    rerender(
      <ScrollArea label="A" orientation="horizontal">
        x
      </ScrollArea>,
    );
    expect(region.className).toContain("overflow-x-auto");
    expect(region.className).toContain("overflow-y-hidden");
    rerender(
      <ScrollArea label="A" orientation="both">
        x
      </ScrollArea>,
    );
    expect(region.className).toContain("overflow-x-auto");
    expect(region.className).toContain("overflow-y-auto");
  });

  it("fades only the edges that have content beyond them", () => {
    render(<ScrollArea label="A">x</ScrollArea>);
    const region = screen.getByRole("region");
    sized(region, { scrollHeight: 500, clientHeight: 100, scrollTop: 0 });
    fireEvent.scroll(region);
    const atTop = maskOf(region);
    expect(atTop).toContain("linear-gradient");
    expect(atTop).not.toContain("transparent 0");
    sized(region, { scrollHeight: 500, clientHeight: 100, scrollTop: 400 });
    fireEvent.scroll(region);
    const atEnd = maskOf(region);
    expect(atEnd).toContain("transparent");
  });

  it("has no mask when nothing overflows or showFades is false", () => {
    const { rerender } = render(<ScrollArea label="A">x</ScrollArea>);
    const region = screen.getByRole("region");
    fireEvent.scroll(region);
    expect(maskOf(region)).toBe("");
    rerender(
      <ScrollArea label="A" showFades={false}>
        x
      </ScrollArea>,
    );
    sized(region, { scrollHeight: 500, clientHeight: 100 });
    fireEvent.scroll(region);
    expect(maskOf(region)).toBe("");
  });

  it("has no axe violations", async () => {
    const { container } = render(<ScrollArea label="Recent items">content</ScrollArea>);
    expect(await axeViolations(container)).toEqual([]);
  });
});
