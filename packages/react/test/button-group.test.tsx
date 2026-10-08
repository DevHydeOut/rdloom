import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, ButtonGroup, Menu, MenuItem, MenuTrigger } from "../src";
import { axeViolations } from "./axe";

describe("ButtonGroup", () => {
  it("is a named group around its buttons", () => {
    render(
      <ButtonGroup label="Calendar view">
        <Button>Day</Button>
        <Button>Week</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole("group", { name: "Calendar view" });
    expect(group).toContainElement(screen.getByRole("button", { name: "Day" }));
    expect(group).toContainElement(screen.getByRole("button", { name: "Week" }));
  });

  it("moves focus through the buttons with Tab and activates with Enter and Space", async () => {
    const user = userEvent.setup();
    const onDay = vi.fn();
    const onWeek = vi.fn();
    render(
      <ButtonGroup label="View">
        <Button onPress={onDay}>Day</Button>
        <Button onPress={onWeek}>Week</Button>
      </ButtonGroup>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Day" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onDay).toHaveBeenCalledTimes(1);
    await user.tab();
    expect(screen.getByRole("button", { name: "Week" })).toHaveFocus();
    await user.keyboard(" ");
    expect(onWeek).toHaveBeenCalledTimes(1);
  });

  it("flattens inner corners and overlaps borders along the orientation", () => {
    const { rerender } = render(
      <ButtonGroup label="View">
        <Button>Day</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("group").className).toContain("flex-row");
    expect(screen.getByRole("group").className).toContain("rounded-s-none");
    rerender(
      <ButtonGroup label="View" orientation="vertical">
        <Button>Day</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("group").className).toContain("flex-col");
    expect(screen.getByRole("group").className).toContain("rounded-t-none");
  });

  it("passes size to Buttons that have none and keeps an explicit one", () => {
    render(
      <ButtonGroup label="Size" size="lg">
        <Button>One</Button>
        <Button size="sm">Two</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("button", { name: "One" }).className).toContain("h-[var(--rd-size-control-lg)]");
    expect(screen.getByRole("button", { name: "Two" }).className).toContain("h-[var(--rd-size-control-sm)]");
  });

  it("keeps a disabled button disabled", () => {
    render(
      <ButtonGroup label="View">
        <Button>Day</Button>
        <Button isDisabled>Week</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("button", { name: "Week" })).toBeDisabled();
  });

  it("works as a split button: the menu button opens a menu with the keyboard", async () => {
    const user = userEvent.setup();
    render(
      <ButtonGroup label="Publish">
        <Button>Publish</Button>
        <MenuTrigger>
          <Button aria-label="More publish options">v</Button>
          <Menu>
            <MenuItem id="draft">Save as draft</MenuItem>
          </Menu>
        </MenuTrigger>
      </ButtonGroup>,
    );
    await user.tab();
    await user.tab();
    const trigger = screen.getByRole("button", { name: "More publish options" });
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("menuitem", { name: "Save as draft" })).toBeInTheDocument();
  });

  it("has no axe violations, including an icon-only toolbar", async () => {
    render(
      <ButtonGroup label="Alignment">
        <Button aria-label="Align left">L</Button>
        <Button aria-label="Align right">R</Button>
      </ButtonGroup>,
    );
    expect(await axeViolations()).toEqual([]);
  });

  it("forwards the ref and className", () => {
    let node: HTMLDivElement | null = null;
    render(
      <ButtonGroup label="View" className="custom" ref={(n) => void (node = n)}>
        <Button>Day</Button>
      </ButtonGroup>,
    );
    expect(node).toBe(screen.getByRole("group"));
    expect(screen.getByRole("group").className).toContain("custom");
  });
});
