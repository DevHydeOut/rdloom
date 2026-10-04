import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../src";
import { axeViolations } from "./axe";

describe("Button", () => {
  it("calls onPress for mouse and keyboard", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Save</Button>);

    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it("does not press when disabled", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Button isDisabled onPress={onPress}>Save</Button>);

    await user.click(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("stays focusable but blocks presses while loading", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Button isLoading onPress={onPress}>Save</Button>);
    const button = screen.getByRole("button");

    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("applies the variant and size from the spec defaults", () => {
    render(<Button>Save</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("--rd-color-action-primary"); // variant="primary"
    expect(cls).toContain("h-10"); // size="md"
  });

  it("has no axe violations", async () => {
    render(
      <>
        <Button>Primary</Button>
        <Button variant="secondary" isDisabled>Disabled</Button>
        <Button variant="danger" isLoading>Loading</Button>
      </>,
    );
    expect(await axeViolations()).toEqual([]);
  });
});
