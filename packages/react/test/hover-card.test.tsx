import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../src";
import { axeViolations } from "./axe";

function Demo(props: Partial<React.ComponentProps<typeof HoverCard>> & { withLinks?: boolean }) {
  const { withLinks, ...rest } = props;
  return (
    <div>
      <HoverCard openDelay={30} closeDelay={30} {...rest}>
        <HoverCardTrigger href="#ada">Ada Lovelace</HoverCardTrigger>
        <HoverCardContent label="Ada Lovelace, profile preview">
          <p>Staff engineer</p>
          {withLinks && (
            <>
              <a href="#one">One</a>
              <a href="#two">Two</a>
            </>
          )}
        </HoverCardContent>
      </HoverCard>
      <a href="#after">After</a>
    </div>
  );
}

const card = () => screen.queryByRole("group", { name: "Ada Lovelace, profile preview" });

describe("HoverCard", () => {
  it("opens after the delay on hover and closes after the close delay", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Demo openDelay={250} onOpenChange={onOpenChange} />);
    expect(card()).not.toBeInTheDocument();
    await user.hover(screen.getByRole("link", { name: "Ada Lovelace" }));
    expect(card()).not.toBeInTheDocument(); // not before the delay
    await waitFor(() => expect(card()).toBeInTheDocument());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(card()).toHaveTextContent("Staff engineer");
    await user.unhover(screen.getByRole("link", { name: "Ada Lovelace" }));
    await waitFor(() => expect(card()).not.toBeInTheDocument());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("stays open while the pointer is over the card", async () => {
    const user = userEvent.setup();
    render(<Demo closeDelay={300} />);
    const trigger = screen.getByRole("link", { name: "Ada Lovelace" });
    await user.hover(trigger);
    await waitFor(() => expect(card()).toBeInTheDocument());
    await user.unhover(trigger);
    await user.hover(card()!);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(card()).toBeInTheDocument();
    await user.unhover(card()!);
    await waitFor(() => expect(card()).not.toBeInTheDocument());
  });

  it("opens on keyboard focus without moving focus, and describes the trigger", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.tab();
    const trigger = screen.getByRole("link", { name: "Ada Lovelace" });
    expect(trigger).toHaveFocus();
    await waitFor(() => expect(card()).toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-describedby", card()!.id);
  });

  it("does not open when a mouse click or a tap focuses the trigger", async () => {
    render(<Demo />);
    const trigger = screen.getByRole("link", { name: "Ada Lovelace" });
    // Touch never fires hover; a tap or a click focuses the link with pointer modality, which must not open the card.
    const touch = { pointerType: "touch", pointerId: 7, isPrimary: true, width: 40, height: 40, pressure: 0.5 };
    fireEvent.pointerEnter(trigger, touch);
    fireEvent.pointerDown(trigger, touch);
    fireEvent.mouseDown(trigger);
    act(() => trigger.focus());
    fireEvent.pointerUp(trigger, touch);
    fireEvent.mouseUp(trigger);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });
    expect(card()).not.toBeInTheDocument();
  });

  it("keeps the trigger's own action", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    const trigger = screen.getByRole("link", { name: "Ada Lovelace" });
    expect(trigger).toHaveAttribute("href", "#ada");
    await user.click(trigger);
    expect(window.location.hash).toBe("#ada");
  });

  it("closes on Escape and keeps focus on the trigger", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.tab();
    await waitFor(() => expect(card()).toBeInTheDocument());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(card()).not.toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Ada Lovelace" })).toHaveFocus();
  });

  it("moves into the card with Tab when it has links, and on past it with Tab after the last", async () => {
    const user = userEvent.setup();
    render(<Demo withLinks />);
    await user.tab();
    await waitFor(() => expect(card()).toBeInTheDocument());
    await user.tab();
    expect(screen.getByRole("link", { name: "One" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Two" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "After" })).toHaveFocus();
    await waitFor(() => expect(card()).not.toBeInTheDocument());
  });

  it("returns to the trigger with Shift+Tab from the first control, and Esc inside the card", async () => {
    const user = userEvent.setup();
    render(<Demo withLinks />);
    await user.tab();
    await waitFor(() => expect(card()).toBeInTheDocument());
    await user.tab();
    await user.tab({ shift: true });
    expect(screen.getByRole("link", { name: "Ada Lovelace" })).toHaveFocus();
    expect(card()).toBeInTheDocument(); // focus is on the trigger, so the card stays
    await user.tab();
    expect(screen.getByRole("link", { name: "One" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(card()).not.toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Ada Lovelace" })).toHaveFocus();
  });

  it("supports controlled and default open state", async () => {
    const { rerender } = render(<Demo isOpen={false} />);
    expect(card()).not.toBeInTheDocument();
    rerender(<Demo isOpen />);
    expect(await screen.findByRole("group", { name: "Ada Lovelace, profile preview" })).toBeInTheDocument();
  });

  it("can start open", async () => {
    render(<Demo defaultOpen />);
    expect(await screen.findByRole("group", { name: "Ada Lovelace, profile preview" })).toBeInTheDocument();
  });

  it("has no axe violations closed or open", async () => {
    const user = userEvent.setup();
    const { container } = render(<Demo withLinks />);
    expect(await axeViolations(container)).toEqual([]);
    await user.hover(screen.getByRole("link", { name: "Ada Lovelace" }));
    await waitFor(() => expect(card()).toBeInTheDocument());
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it("renders the trigger on the server and not the card", () => {
    const html = renderToString(<Demo />);
    expect(html).toContain("Ada Lovelace");
    expect(html).not.toContain("Staff engineer");
  });

  it("fails clearly outside a HoverCard", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<HoverCardTrigger href="#x">x</HoverCardTrigger>)).toThrow(/inside a HoverCard/);
    spy.mockRestore();
  });
});
