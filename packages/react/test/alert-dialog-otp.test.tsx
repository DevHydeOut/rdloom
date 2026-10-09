import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AlertDialog, Button, DialogTrigger, InputOTP } from "../src";
import { axeViolations } from "./axe";

function Harness(props: Partial<React.ComponentProps<typeof AlertDialog>>) {
  return (
    <DialogTrigger>
      <Button>Delete user</Button>
      <AlertDialog title="Delete this user?" description="This cannot be undone." confirmLabel="Delete" {...props} />
    </DialogTrigger>
  );
}

describe("AlertDialog", () => {
  it("opens as an alertdialog named by its title and described by its description", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Delete this user?" });
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
  });

  it("starts focus on Cancel for the danger tone and returns it to the trigger", async () => {
    const user = userEvent.setup();
    render(<Harness tone="danger" />);
    const trigger = screen.getByRole("button", { name: "Delete user" });
    await user.click(trigger);
    await screen.findByRole("alertdialog");
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("Escape cancels and calls onCancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<Harness onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    await screen.findByRole("alertdialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking outside", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(dialog.closest("[data-rac]")!.parentElement as HTMLElement);
    await user.click(document.body);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("confirm calls onConfirm and closes", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Harness tone="danger" onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cancel button closes without confirming", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<Harness onConfirm={onConfirm} onCancel={onCancel} cancelLabel="Keep user" />);
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    await user.click(await screen.findByRole("button", { name: "Keep user" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("waits for an async confirm: pending state, no dismissal, closes on resolve", async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    render(<Harness tone="danger" onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "Delete" })).toHaveAttribute("data-pending", "true");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await act(async () => finish());
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("stays open when an async confirm rejects", async () => {
    const user = userEvent.setup();
    render(<Harness onConfirm={() => Promise.reject(new Error("nope"))} />);
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled());
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("requires the confirm word before the confirm button works", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Harness tone="danger" confirmText="Northwind" onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    const field = await screen.findByRole("textbox", { name: "Type Northwind to confirm" });
    const confirm = screen.getByRole("button", { name: "Delete" });
    expect(confirm).toBeDisabled();
    await user.type(field, "North");
    expect(confirm).toBeDisabled();
    await user.type(field, "wind");
    expect(confirm).toBeEnabled();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it("works standalone with isOpen and onOpenChange", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<AlertDialog title="Sure?" isOpen onOpenChange={onOpenChange} />);
    await screen.findByRole("alertdialog", { name: "Sure?" });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("has no axe violations (default and type-to-confirm)", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Harness confirmText="Northwind" />);
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(await axeViolations(dialog)).toEqual([]);
    unmount();
  });

  it("renders on the server without opening", () => {
    expect(renderToString(<Harness />)).toContain("Delete user");
  });
});

describe("InputOTP", () => {
  it("is a group named by its label with one autofill-ready input", () => {
    render(<InputOTP label="Verification code" description="Sent by SMS." />);
    const group = screen.getByRole("group", { name: "Verification code" });
    expect(group).toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: "Verification code" });
    expect(input).toHaveAttribute("autocomplete", "one-time-code");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAccessibleDescription("Sent by SMS.");
    expect(document.querySelectorAll("input")).toHaveLength(1);
  });

  it("accepts only digits, caps at length and calls onComplete once", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onComplete = vi.fn();
    render(<InputOTP label="Code" length={4} onChange={onChange} onComplete={onComplete} />);
    const input = screen.getByRole("textbox");
    await user.type(input, "1a2b34");
    expect(input).toHaveValue("1234");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("1234");
    expect(onChange).toHaveBeenLastCalledWith("1234");
  });

  it("backspace removes the last character", async () => {
    const user = userEvent.setup();
    render(<InputOTP label="Code" defaultValue="123" />);
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.keyboard("{End}{Backspace}");
    expect(input).toHaveValue("12");
  });

  it("paste fills every cell, ignoring separators", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<InputOTP label="Code" onComplete={onComplete} />);
    await user.click(screen.getByRole("textbox"));
    await user.paste("123-456");
    expect(screen.getByRole("textbox")).toHaveValue("123456");
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("alphanumeric accepts letters and uses the text keyboard", async () => {
    const user = userEvent.setup();
    render(<InputOTP label="Code" type="alphanumeric" length={4} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("inputmode", "text");
    await user.type(input, "a-B3!9");
    expect(input).toHaveValue("aB39");
  });

  it("announces the digit position as arrow keys move", async () => {
    const user = userEvent.setup();
    render(<InputOTP label="Code" defaultValue="123456" />);
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.keyboard("{End}");
    expect(screen.getByRole("status")).toHaveTextContent("Digit 6 of 6");
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("status")).toHaveTextContent("Digit 5 of 6");
  });

  it("draws separators and masks with dots", () => {
    const { container } = render(<InputOTP label="Code" defaultValue="123456" separatorAt={[3]} mask />);
    expect(container.querySelectorAll("[data-separator]")).toHaveLength(1);
    expect(screen.getByLabelText("Code", { selector: "input" })).toHaveAttribute("type", "password");
    expect(container.textContent).not.toContain("123");
  });

  it("is controlled", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<InputOTP label="Code" value="12" onChange={() => {}} />);
    const input = screen.getByRole("textbox");
    await user.type(input, "3");
    expect(input).toHaveValue("12");
    rerender(<InputOTP label="Code" value="123" onChange={() => {}} />);
    expect(input).toHaveValue("123");
  });

  it("shows the error and marks the input invalid; disabled blocks input", async () => {
    const { rerender } = render(<InputOTP label="Code" isInvalid errorMessage="Wrong code." />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Wrong code.");
    rerender(<InputOTP label="Code" isDisabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("has no axe violations", async () => {
    const { container } = render(<InputOTP label="Code" description="Sent by SMS." separatorAt={[3]} defaultValue="12" />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders on the server", () => {
    const html = renderToString(<InputOTP label="Code" defaultValue="12" />);
    expect(html).toContain("one-time-code");
    expect(html).toContain("Code");
  });
});
