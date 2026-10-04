import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button, Combobox, ComboboxItem, DatePicker, Select, SelectItem, TextField } from "../src";

// Found in the sample app: defaulting isInvalid to false made React Aria treat
// validity as controlled, so a required field left empty showed no error.
describe("built-in validation on submit", () => {
  function Form() {
    return (
      <form onSubmit={(e) => e.preventDefault()}>
        <TextField label="Name" isRequired />
        <Select label="Role" isRequired>
          <SelectItem id="a">Admin</SelectItem>
        </Select>
        <Combobox label="Country" isRequired defaultItems={[{ id: "in", name: "India" }]}>
          {(c) => <ComboboxItem id={c.id}>{c.name}</ComboboxItem>}
        </Combobox>
        <DatePicker label="Due" isRequired />
        <Button type="submit">Save</Button>
      </form>
    );
  }

  it("marks empty required fields invalid and shows a message", async () => {
    render(<Form />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    const name = screen.getByRole("textbox", { name: "Name" });
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription(/.+/);
    expect(name).toHaveFocus(); // the first invalid field
    expect(screen.getByRole("combobox", { name: "Country" })).toHaveAttribute("aria-invalid", "true");
    expect(document.querySelectorAll("[data-invalid]").length).toBeGreaterThanOrEqual(4);
  });

  it("still lets the app control validity", async () => {
    render(<TextField label="Email" isInvalid errorMessage="Taken" />);
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Taken")).toBeInTheDocument();
  });
});
