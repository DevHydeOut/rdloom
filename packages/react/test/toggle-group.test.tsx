import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToggleGroup, ToggleGroupItem } from "../src";
import { axeViolations } from "./axe";

function setup(props: Partial<React.ComponentProps<typeof ToggleGroup>> = {}) {
  return render(
    <ToggleGroup aria-label="Style" {...props}>
      <ToggleGroupItem id="bold">Bold</ToggleGroupItem>
      <ToggleGroupItem id="italic">Italic</ToggleGroupItem>
      <ToggleGroupItem id="underline">Underline</ToggleGroupItem>
    </ToggleGroup>,
  );
}

describe("ToggleGroup", () => {
  it("allows several pressed items in multiple mode", async () => {
    const user = userEvent.setup();
    setup({ selectionMode: "multiple" });
    await user.click(screen.getByRole("button", { name: "Bold" }));
    await user.click(screen.getByRole("button", { name: "Italic" }));
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "true");
  });

  it("allows one checked item in single mode", async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.getByRole("radiogroup", { name: "Style" })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Bold" }));
    await user.click(screen.getByRole("radio", { name: "Italic" }));
    expect(screen.getByRole("radio", { name: "Bold" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: "Italic" })).toHaveAttribute("aria-checked", "true");
  });

  it("moves focus with arrow keys and toggles with Space", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ selectionMode: "multiple", onSelectionChange: onChange });
    await user.tab();
    expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "true");
  });

  it("follows the vertical orientation with the down arrow", async () => {
    const user = userEvent.setup();
    setup({ selectionMode: "multiple", orientation: "vertical" });
    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
  });

  it("starts with the default selection", () => {
    setup({ selectionMode: "multiple", defaultSelectedKeys: ["underline"] });
    expect(screen.getByRole("button", { name: "Underline" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps one item pressed when empty selection is disallowed", async () => {
    const user = userEvent.setup();
    setup({ defaultSelectedKeys: ["bold"], disallowEmptySelection: true });
    await user.click(screen.getByRole("radio", { name: "Bold" }));
    expect(screen.getByRole("radio", { name: "Bold" })).toHaveAttribute("aria-checked", "true");
  });

  it("does nothing when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ isDisabled: true, selectionMode: "multiple", onSelectionChange: onChange });
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Bold" })).toBeDisabled();
  });

  it("names an icon-only item by its aria-label", () => {
    render(
      <ToggleGroup aria-label="Align" selectionMode="multiple">
        <ToggleGroupItem id="a" aria-label="Align left">
          <svg aria-hidden="true" />
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole("button", { name: "Align left" })).toBeInTheDocument();
  });

  it("applies size and variant to items", () => {
    setup({ size: "lg", variant: "ghost", selectionMode: "multiple" });
    const item = screen.getByRole("button", { name: "Bold" });
    expect(item.className).toContain("rd-size-control-lg");
    expect(item.className).toContain("border-transparent");
  });

  it("has no axe violations in either mode", async () => {
    const { container } = setup({ selectionMode: "multiple" });
    expect(await axeViolations(container)).toEqual([]);
    const second = setup();
    expect(await axeViolations(second.container)).toEqual([]);
  });
});
