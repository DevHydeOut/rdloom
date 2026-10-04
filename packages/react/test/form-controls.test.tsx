import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox, Radio, RadioGroup, Switch, TextField } from "../src";
import { axeViolations } from "./axe";

describe("TextField", () => {
  it("links the label, description and error to the input", () => {
    render(<TextField label="Email" description="Work email" isInvalid errorMessage="Required" />);
    const input = screen.getByRole("textbox", { name: "Email" });

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(expect.stringContaining("Work email"));
    expect(input).toHaveAccessibleDescription(expect.stringContaining("Required"));
  });

  it("reports typed text through onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextField label="Name" onChange={onChange} />);

    await user.type(screen.getByRole("textbox"), "Ada");
    expect(onChange).toHaveBeenLastCalledWith("Ada");
  });

  it("renders a textarea when multiline", () => {
    render(<TextField label="Notes" multiline />);
    expect(screen.getByRole("textbox", { name: "Notes" }).tagName).toBe("TEXTAREA");
  });

  it("marks required fields", () => {
    render(<TextField label="Email" isRequired />);
    expect(screen.getByRole("textbox")).toBeRequired();
  });
});

describe("Checkbox", () => {
  it("toggles with click and Space", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox onChange={onChange}>Email me</Checkbox>);
    const box = screen.getByRole("checkbox", { name: "Email me" });

    await user.click(box);
    expect(box).toBeChecked();
    await user.keyboard(" ");
    expect(box).not.toBeChecked();
    expect(onChange).toHaveBeenNthCalledWith(1, true);
    expect(onChange).toHaveBeenNthCalledWith(2, false);
  });

  it("exposes the indeterminate state", () => {
    render(<Checkbox isIndeterminate>Select all</Checkbox>);
    expect(screen.getByRole("checkbox")).toBePartiallyChecked();
  });
});

describe("Switch", () => {
  it("toggles and uses the switch role", async () => {
    const user = userEvent.setup();
    render(<Switch>Dark mode</Switch>);
    const toggle = screen.getByRole("switch", { name: "Dark mode" });

    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    expect(toggle).toBeChecked();
  });
});

describe("RadioGroup", () => {
  it("selects with arrow keys and keeps one tab stop", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RadioGroup label="Plan" defaultValue="free" onChange={onChange}>
        <Radio value="free">Free</Radio>
        <Radio value="pro">Pro</Radio>
      </RadioGroup>,
    );

    expect(screen.getByRole("radiogroup", { name: "Plan" })).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole("radio", { name: "Free" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
    expect(onChange).toHaveBeenCalledWith("pro");
  });
});

describe("form controls", () => {
  it("have no axe violations", async () => {
    render(
      <form>
        <TextField label="Email" description="Work email" isRequired />
        <TextField label="Username" isInvalid errorMessage="Taken" />
        <TextField label="Notes" multiline />
        <Checkbox defaultSelected>Updates</Checkbox>
        <Checkbox isIndeterminate>All</Checkbox>
        <Switch>Dark mode</Switch>
        <RadioGroup label="Plan" defaultValue="pro">
          <Radio value="free">Free</Radio>
          <Radio value="pro">Pro</Radio>
        </RadioGroup>
      </form>,
    );
    expect(await axeViolations()).toEqual([]);
  });
});
