import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from "../src";
import { axeViolations } from "./axe";

describe("Item", () => {
  it("renders media, title, description and actions", () => {
    render(
      <Item>
        <ItemMedia variant="icon">i</ItemMedia>
        <ItemContent>
          <ItemTitle>Ada</ItemTitle>
          <ItemDescription>Lead</ItemDescription>
        </ItemContent>
        <ItemActions>
          <button type="button">Edit</button>
        </ItemActions>
      </Item>,
    );
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("Lead")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("applies the variant and size", () => {
    const { container } = render(
      <Item variant="outline" size="sm">
        <ItemContent>
          <ItemTitle>Row</ItemTitle>
        </ItemContent>
      </Item>,
    );
    expect(container.firstElementChild).toHaveClass("border-[var(--rd-color-border-default)]", "px-3");
    const muted = render(<Item variant="muted">x</Item>);
    expect(muted.container.firstElementChild).toHaveClass("bg-[var(--rd-color-surface-subtle)]");
  });

  it("is a link when href is set, and keeps actions outside the link", () => {
    render(
      <Item href="/people/ada">
        <ItemContent>
          <ItemTitle>Ada</ItemTitle>
        </ItemContent>
        <ItemActions>
          <button type="button">Remove</button>
        </ItemActions>
      </Item>,
    );
    const link = screen.getByRole("link", { name: "Ada" });
    expect(link).toHaveAttribute("href", "/people/ada");
    const action = screen.getByRole("button", { name: "Remove" });
    expect(link.contains(action)).toBe(false);
    expect(link.querySelector("button, a")).toBeNull();
  });

  it("is a button when onPress is set and presses with Enter and Space", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Item onPress={onPress}>
        <ItemContent>
          <ItemTitle>Open</ItemTitle>
        </ItemContent>
      </Item>,
    );
    await user.tab();
    const button = screen.getByRole("button", { name: "Open" });
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("keeps actions separately clickable and in the tab order", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const onAction = vi.fn();
    render(
      <Item onPress={onPress}>
        <ItemContent>
          <ItemTitle>Row</ItemTitle>
        </ItemContent>
        <ItemActions>
          <button type="button" onClick={onAction}>
            More
          </button>
        </ItemActions>
      </Item>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Row" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "More" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "More" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("disables the row control", () => {
    render(
      <Item onPress={() => {}} isDisabled>
        <ItemContent>
          <ItemTitle>Locked</ItemTitle>
        </ItemContent>
      </Item>,
    );
    expect(screen.getByRole("button", { name: "Locked" })).toBeDisabled();
  });

  it("merges className and forwards the ref", () => {
    let node: HTMLElement | null = null;
    render(
      <Item className="extra" ref={(n) => (node = n)}>
        x
      </Item>,
    );
    expect(node).toHaveClass("extra");
  });
});

describe("ItemGroup", () => {
  it("is a list of list items", () => {
    render(
      <ItemGroup aria-label="People">
        <Item>
          <ItemTitle>Ada</ItemTitle>
        </Item>
        <ItemSeparator />
        <Item>
          <ItemTitle>Grace</ItemTitle>
        </Item>
      </ItemGroup>,
    );
    expect(screen.getByRole("list", { name: "People" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("has no axe violations as a plain list, with links and actions, and with separators", async () => {
    const { container } = render(
      <ItemGroup aria-label="Files">
        <Item href="/a">
          <ItemMedia variant="icon">
            <span aria-hidden="true">*</span>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>First</ItemTitle>
            <ItemDescription>Open it</ItemDescription>
          </ItemContent>
          <ItemActions>
            <button type="button">Share</button>
          </ItemActions>
        </Item>
        <ItemSeparator />
        <Item onPress={() => {}} variant="outline">
          <ItemContent>
            <ItemTitle>Second</ItemTitle>
          </ItemContent>
        </Item>
        <Item variant="muted" size="sm">
          <ItemTitle>Third</ItemTitle>
        </Item>
      </ItemGroup>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
