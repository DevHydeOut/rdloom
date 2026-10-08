import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NativeSelect } from "../src";
import { axeViolations } from "./axe";

const options = [
  { value: "ca", label: "Canada" },
  { value: "in", label: "India" },
];

describe("NativeSelect", () => {
  it("links the label to a native select and has no axe violations", async () => {
    const { container } = render(<NativeSelect label="Country" options={options} />);
    const select = screen.getByLabelText("Country");
    expect(select.tagName).toBe("SELECT");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders groups from data and from children", () => {
    const { rerender } = render(
      <NativeSelect label="Zone" options={[{ label: "Europe", options: [{ value: "a", label: "Berlin" }] }]} />,
    );
    expect(screen.getByRole("group", { name: "Europe" })).toBeInTheDocument();
    rerender(
      <NativeSelect label="Zone">
        <optgroup label="Asia">
          <option value="t">Tokyo</option>
        </optgroup>
      </NativeSelect>,
    );
    expect(screen.getByRole("group", { name: "Asia" })).toBeInTheDocument();
  });

  it("shows a disabled placeholder option first and starts on it", () => {
    render(<NativeSelect label="Country" placeholder="Choose" options={options} />);
    const first = screen.getAllByRole("option")[0] as HTMLOptionElement;
    expect(first).toHaveTextContent("Choose");
    expect(first.disabled).toBe(true);
    expect((screen.getByLabelText("Country") as HTMLSelectElement).value).toBe("");
  });

  it("changes value, calls onChange and posts with its name", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <NativeSelect label="Country" name="country" options={options} onChange={onChange} />
      </form>,
    );
    await user.selectOptions(screen.getByLabelText("Country"), "in");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(new FormData(container.querySelector("form")!).get("country")).toBe("in");
  });

  it("honours defaultValue and a controlled value", () => {
    const { rerender } = render(<NativeSelect label="Country" defaultValue="in" options={options} />);
    expect((screen.getByLabelText("Country") as HTMLSelectElement).value).toBe("in");
    rerender(<NativeSelect label="Country" value="ca" onChange={() => {}} options={options} />);
    expect((screen.getByLabelText("Country") as HTMLSelectElement).value).toBe("ca");
  });

  it("shows the error and marks the select invalid", async () => {
    const { container } = render(
      <NativeSelect label="Country" description="Where you live" isInvalid errorMessage="Pick one" options={options} />,
    );
    const select = screen.getByLabelText("Country");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Where you live Pick one");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("disables and requires the select, with a decorative chevron", () => {
    const { container } = render(<NativeSelect label="Country" isDisabled isRequired options={options} />);
    const select = screen.getByLabelText(/Country/);
    expect(select).toBeDisabled();
    expect(select).toBeRequired();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
