import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ColorPicker, ColorPickerPanel, Form, FormColorPicker, FormRating, FormSubmitButton, Rating } from "../src";
import { axeViolations } from "./axe";

describe("ColorPicker", () => {
  it("shows the label, a swatch with the color's name, and the hex on the button", () => {
    render(<ColorPicker label="Brand color" defaultValue="#ff0000" />);
    const button = screen.getByRole("button", { name: /Brand color/ });
    expect(button).toHaveTextContent("#ff0000");
    expect(button).toHaveAttribute("aria-expanded", "false");
    // The swatch is an image named by the color, so the color is announced as a word too.
    expect(within(button).getByRole("img").getAttribute("aria-label")).toMatch(/red/i);
  });

  it("writes the color on the button in the chosen format", () => {
    const { rerender } = render(<ColorPicker label="C" defaultValue="#ff0000" format="rgb" />);
    expect(screen.getByRole("button")).toHaveTextContent("rgb(255, 0, 0)");
    rerender(<ColorPicker label="C" defaultValue="#ff0000" format="hsl" />);
    expect(screen.getByRole("button")).toHaveTextContent("hsl(0, 100%, 50%)");
  });

  it("opens a named dialog with the area, hue slider, hex field and presets, and closes on Escape", async () => {
    const user = userEvent.setup();
    render(<ColorPicker label="Brand color" defaultValue="#336699" presets={["#ff0000", "#00ff00"]} />);
    const trigger = screen.getByRole("button", { name: /Brand color/ });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Brand color picker" });
    // The area is one 2D slider (saturation across, brightness up); the hue slider is the second.
    expect(within(dialog).getAllByRole("slider")).toHaveLength(2);
    expect(within(dialog).getAllByRole("slider")[0]).toHaveAttribute("aria-roledescription", "2D slider");
    expect(within(dialog).getByRole("slider", { name: /Hue/ })).toBeInTheDocument();
    expect(within(dialog).getByRole("textbox", { name: "Hex color" })).toHaveValue("#336699");
    const presets = within(dialog).getByRole("listbox", { name: "Preset colors" });
    expect(within(presets).getAllByRole("option")).toHaveLength(2);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("changes with the hue slider's arrow keys and reports lowercase hex", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker label="C" defaultValue="#ff0000" onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    const hue = await screen.findByRole("slider", { name: /Hue/ });
    hue.focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls.at(-1)![0] as string;
    expect(next).toMatch(/^#[0-9a-f]{6}$/);
    expect(next).not.toBe("#ff0000");
  });

  it("changes the saturation and brightness area with the arrow keys", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker label="C" defaultValue="#ff8040" onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    const dialog = await screen.findByRole("dialog");
    const [saturation] = within(dialog).getAllByRole("slider");
    saturation.focus();
    await user.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenCalled();
  });

  it("sets the color from the hex field and picks a preset", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker label="C" defaultValue="#000000" presets={["#ff0000", "#00ff00"]} onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    const hex = await screen.findByRole("textbox", { name: "Hex color" });
    await user.clear(hex);
    await user.type(hex, "#1971c2{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("#1971c2");
    await user.click(screen.getAllByRole("option")[1]);
    expect(onChange).toHaveBeenLastCalledWith("#00ff00");
    expect(screen.getByRole("button", { name: /C/, hidden: true })).toHaveTextContent("#00ff00");
  });

  it("is controlled by value and follows outside changes", () => {
    const { rerender } = render(<ColorPicker label="C" value="#112233" />);
    expect(screen.getByRole("button")).toHaveTextContent("#112233");
    rerender(<ColorPicker label="C" value="#445566" />);
    expect(screen.getByRole("button")).toHaveTextContent("#445566");
  });

  it("adds an opacity slider and uses #rrggbbaa with showAlpha", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker label="C" defaultValue="#ff0000ff" showAlpha onChange={onChange} />);
    expect(screen.getByRole("button")).toHaveTextContent("#ff0000ff");
    await user.click(screen.getByRole("button"));
    const alpha = await screen.findByRole("slider", { name: /Opacity/ });
    alpha.focus();
    await user.keyboard("{ArrowLeft}");
    expect(onChange.mock.calls.at(-1)![0]).toMatch(/^#ff0000[0-9a-f]{2}$/);
    expect(onChange.mock.calls.at(-1)![0]).not.toBe("#ff0000ff");
  });

  it("has no opacity slider by default", async () => {
    const user = userEvent.setup();
    render(<ColorPicker label="C" defaultValue="#ff0000" />);
    await user.click(screen.getByRole("button"));
    await screen.findByRole("dialog");
    expect(screen.queryByRole("slider", { name: /Opacity/ })).not.toBeInTheDocument();
  });

  it("does not open when disabled, and shows description and error text", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ColorPicker label="C" isDisabled description="Used for headings" />);
    await user.click(screen.getByRole("button"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAccessibleDescription("Used for headings");
    rerender(<ColorPicker label="C" isInvalid errorMessage="Too light" />);
    expect(screen.getByRole("button")).toHaveAccessibleDescription("Too light");
  });

  it("submits its value with a form when named", () => {
    const { container } = render(
      <form>
        <ColorPicker label="C" name="brand" defaultValue="#abcdef" />
      </form>,
    );
    expect(container.querySelector<HTMLInputElement>('input[name="brand"]')).toHaveValue("#abcdef");
  });

  it("works inside a Form by name", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form defaultValues={{ color: "#112233" }} onSubmit={onSubmit}>
        <FormColorPicker name="color" label="Color" presets={["#ff0000"]} />
        <FormSubmitButton>Save</FormSubmitButton>
      </Form>,
    );
    await user.click(screen.getByRole("button", { name: /Color/ }));
    await user.click(await screen.findByRole("option"));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ color: "#ff0000" });
  });

  it("shows a Form error under the picker", async () => {
    const user = userEvent.setup();
    render(
      <Form defaultValues={{ color: "#ffffff" }} onSubmit={() => {}}>
        <FormColorPicker name="color" label="Color" validate={(v) => (v === "#ffffff" ? "Too light" : undefined)} />
        <FormSubmitButton>Save</FormSubmitButton>
      </Form>,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Too light")).toBeInTheDocument();
  });

  it("renders an inline panel without a popover, as a named group", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPickerPanel label="Accent color" defaultValue="#336699" presets={["#ff0000"]} onChange={onChange} />);
    const group = screen.getByRole("group", { name: "Accent color" });
    expect(within(group).getByRole("textbox", { name: "Hex color" })).toHaveValue("#336699");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(within(group).getByRole("option"));
    expect(onChange).toHaveBeenLastCalledWith("#ff0000");
  });

  it("has no axe violations (closed, open, inline)", async () => {
    const user = userEvent.setup();
    const { container } = render(<ColorPicker label="Brand" defaultValue="#336699" presets={["#ff0000", "#00ff00"]} showAlpha description="Help" />);
    expect(await axeViolations(container)).toEqual([]);
    await user.click(screen.getByRole("button"));
    await screen.findByRole("dialog");
    expect(await axeViolations(document.body)).toEqual([]);
    const inline = render(<ColorPickerPanel label="Accent" presets={["#ff0000"]} showAlpha />);
    expect(await axeViolations(inline.container)).toEqual([]);
  });

  it("renders the button on the server", () => {
    const html = renderToString(<ColorPicker label="Brand" defaultValue="#336699" />);
    expect(html).toContain("#336699");
    expect(html).toContain("Brand");
  });
});

describe("Rating", () => {
  it("is a radio group named with its range, with a radio per star", () => {
    render(<Rating label="Rating" />);
    expect(screen.getByRole("radiogroup", { name: "Rating, 1 to 5 stars" })).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("aria-label"))).toEqual(["1 star", "2 stars", "3 stars", "4 stars", "5 stars"]);
    expect(radios.every((r) => !(r as HTMLInputElement).checked)).toBe(true);
  });

  it("chooses a star with a click and reports the number", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Rating label="Rating" onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(onChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole("radio", { name: "4 stars" })).toBeChecked();
  });

  it("moves with the arrow keys", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Rating label="Rating" defaultValue={2} onChange={onChange} />);
    await user.tab();
    expect(screen.getByRole("radio", { name: "2 stars" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByRole("radio", { name: "3 stars" })).toBeChecked();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("shows chosen stars filled and the rest as outlines", () => {
    const { container } = render(<Rating label="Rating" defaultValue={3} />);
    // a filled star adds a second icon on top of the outline
    expect(container.querySelectorAll('svg path[fill="currentColor"]')).toHaveLength(3);
    expect(container.querySelectorAll("svg")).toHaveLength(8);
  });

  it("supports half stars", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Rating label="Rating" allowHalf onChange={onChange} />);
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(10);
    expect(radios[0]).toHaveAttribute("aria-label", "0.5 stars");
    expect(radios[2]).toHaveAttribute("aria-label", "1.5 stars");
    await user.click(screen.getByRole("radio", { name: "2.5 stars" }));
    expect(onChange).toHaveBeenCalledWith(2.5);
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("honors max", () => {
    render(<Rating label="Rating" max={3} />);
    expect(screen.getByRole("radiogroup", { name: "Rating, 1 to 3 stars" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("is controlled", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [v, setV] = useState(1);
      return (
        <>
          <Rating label="Rating" value={v} onChange={setV} />
          <p>Value {v}</p>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole("radio", { name: "1 star" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "5 stars" }));
    expect(screen.getByText("Value 5")).toBeInTheDocument();
  });

  it("clears with the Clear button and keeps focus in the stars", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Rating label="Rating" defaultValue={3} clearable onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Clear rating" }));
    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(screen.getAllByRole("radio").every((r) => !(r as HTMLInputElement).checked)).toBe(true);
    expect(screen.getByRole("button", { name: "Clear rating" })).toBeDisabled();
    expect(screen.getAllByRole("radio")[0]).toHaveFocus();
  });

  it("does nothing when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Rating label="Rating" isDisabled onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: "3 stars", hidden: true }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getAllByRole("radio").every((r) => (r as HTMLInputElement).disabled)).toBe(true);
  });

  it("reads as an image with a text alternative when read-only, with the count as text", () => {
    render(<Rating label="Average" value={4.5} allowHalf isReadOnly count={1284} />);
    expect(screen.getByRole("img", { name: "4.5 out of 5 stars" })).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByText("1,284 ratings")).toBeInTheDocument();
  });

  it("rounds the read-only display but not its text", () => {
    const { container } = render(<Rating label="Average" value={3.8} isReadOnly countLabel="reviews" count={2} />);
    expect(screen.getByRole("img", { name: "3.8 out of 5 stars" })).toBeInTheDocument();
    expect(container.querySelectorAll('svg path[fill="currentColor"]')).toHaveLength(4);
    expect(screen.getByText("2 reviews")).toBeInTheDocument();
  });

  it("sizes the stars", () => {
    const { container } = render(
      <>
        <Rating label="S" size="sm" isReadOnly value={1} />
        <Rating label="L" size="lg" isReadOnly value={1} />
      </>,
    );
    const sizes = Array.from(container.querySelectorAll("svg")).map((s) => s.getAttribute("class"));
    expect(sizes.some((c) => c?.includes("size-5"))).toBe(true);
    expect(sizes.some((c) => c?.includes("size-8"))).toBe(true);
  });

  it("works inside a Form and enforces isRequired", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form defaultValues={{ stars: 0 }} onSubmit={onSubmit}>
        <FormRating name="stars" label="Rating" isRequired requiredMessage="Choose a rating" />
        <FormSubmitButton>Send</FormSubmitButton>
      </Form>,
    );
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Choose a rating")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("radio", { name: "4 stars" }));
    await user.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ stars: 4 });
  });

  it("submits its value by name", () => {
    const { container } = render(
      <form>
        <Rating label="Rating" name="stars" defaultValue={2} />
      </form>,
    );
    expect(container.querySelector<HTMLInputElement>('input[name="stars"]:checked')?.value).toBe("2");
  });

  it("has no axe violations (input, hidden label, error, read-only)", async () => {
    const { container } = render(
      <>
        <Rating label="Rating" defaultValue={2} clearable description="Optional" />
        <Rating label="Service" isLabelHidden allowHalf size="lg" />
        <Rating label="Quality" isInvalid errorMessage="Choose a rating" />
        <Rating label="Average" isReadOnly value={4} count={12} />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders on the server", () => {
    expect(renderToString(<Rating label="Rating" defaultValue={2} />)).toContain("2 stars");
    expect(renderToString(<Rating label="Rating" isReadOnly value={4} />)).toContain("4 out of 5 stars");
  });
});
