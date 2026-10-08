import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, InputGroup, InputGroupAddon, InputGroupInput } from "../src";
import { axeViolations } from "./axe";

function describedText(input: HTMLElement) {
  return (input.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent)
    .join("|");
}

describe("InputGroup", () => {
  it("names the input by the label and reads text addons and help text as its description", () => {
    render(
      <InputGroup label="Amount" description="Charged once.">
        <InputGroupAddon>$</InputGroupAddon>
        <InputGroupInput />
        <InputGroupAddon align="end">USD</InputGroupAddon>
      </InputGroup>,
    );
    const input = screen.getByRole("textbox", { name: "Amount" });
    expect(describedText(input)).toBe("Charged once.|$|USD");
  });

  it("hides icon addons and does not describe the input with them", () => {
    render(
      <InputGroup label="Search">
        <InputGroupAddon type="icon">
          <svg data-testid="icon" />
        </InputGroupAddon>
        <InputGroupInput />
      </InputGroup>,
    );
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("textbox", { name: "Search" })).not.toHaveAttribute("aria-describedby");
  });

  it("accepts typing and reports changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <InputGroup label="Name" onChange={onChange}>
        <InputGroupInput />
      </InputGroup>,
    );
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada");
    expect(onChange).toHaveBeenLastCalledWith("Ada");
  });

  it("tabs from the input to an addon button, which acts on Enter and Space", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <InputGroup label="Search" defaultValue="x">
        <InputGroupInput />
        <InputGroupAddon type="button" align="end">
          <Button aria-label="Clear search" onPress={onPress}>
            x
          </Button>
        </InputGroupAddon>
      </InputGroup>,
    );
    await user.tab();
    expect(screen.getByRole("textbox")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Clear search" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onPress).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-describedby");
  });

  it("shows the error message and marks the input invalid", () => {
    render(
      <InputGroup label="Domain" isInvalid errorMessage="That name is taken.">
        <InputGroupAddon>https://</InputGroupAddon>
        <InputGroupInput />
      </InputGroup>,
    );
    const input = screen.getByRole("textbox", { name: "Domain" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(describedText(input)).toContain("That name is taken.");
    expect(describedText(input)).toContain("https://");
  });

  it("disables and makes the input read-only on the input itself", () => {
    const { rerender } = render(
      <InputGroup label="Name" isDisabled>
        <InputGroupInput />
      </InputGroup>,
    );
    expect(screen.getByRole("textbox", { name: "Name" })).toBeDisabled();
    rerender(
      <InputGroup label="Name" isReadOnly defaultValue="Ada">
        <InputGroupInput />
      </InputGroup>,
    );
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAttribute("readonly");
  });

  it("marks the group when the input has focus so the whole box can show the ring", async () => {
    const user = userEvent.setup();
    render(
      <InputGroup label="Name">
        <InputGroupInput />
      </InputGroup>,
    );
    const input = screen.getByRole("textbox");
    expect(input.parentElement?.className).toContain("focus-within:ring-2");
    await user.tab();
    expect(input).toHaveFocus();
    expect(input.parentElement?.matches(":focus-within")).toBe(true);
  });

  it("passes the input type, so a password can be shown and hidden", () => {
    render(
      <InputGroup label="Password">
        <InputGroupInput type="password" />
      </InputGroup>,
    );
    expect(document.querySelector("input")).toHaveAttribute("type", "password");
  });

  it("has no axe violations with text, icon and button addons", async () => {
    render(
      <InputGroup label="Amount" description="Help">
        <InputGroupAddon type="icon">
          <svg />
        </InputGroupAddon>
        <InputGroupAddon>$</InputGroupAddon>
        <InputGroupInput />
        <InputGroupAddon type="button" align="end">
          <Button aria-label="Copy">c</Button>
        </InputGroupAddon>
      </InputGroup>,
    );
    expect(await axeViolations()).toEqual([]);
  });

  it("forwards the ref and className", () => {
    let node: HTMLDivElement | null = null;
    render(
      <InputGroup label="Name" className="custom" ref={(n) => void (node = n)}>
        <InputGroupInput />
      </InputGroup>,
    );
    expect(node).not.toBeNull();
    expect((node as unknown as HTMLElement).className).toContain("custom");
  });
});
