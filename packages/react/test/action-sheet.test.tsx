import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ActionSheet, Button, DialogTrigger, type ActionSheetAction } from "../src";
import { axeViolations } from "./axe";

const deferred = () => {
  let resolve!: () => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const action = (id: string, patch: Partial<ActionSheetAction> = {}): ActionSheetAction => ({ id, label: id[0].toUpperCase() + id.slice(1), onAction: vi.fn(), ...patch });

const setup = (props: Partial<ComponentProps<typeof ActionSheet>> = {}) =>
  render(
    <DialogTrigger>
      <Button>Open</Button>
      <ActionSheet title="Invoice 1042" description="Northgate Foods" actions={[action("download"), action("send")]} {...props} />
    </DialogTrigger>,
  );

async function openIt() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Open" }));
  const dialog = await screen.findByRole("dialog");
  return { user, dialog };
}

describe("ActionSheet", () => {
  it("opens as a named dialog with the description, the actions and Cancel", async () => {
    setup();
    const { dialog } = await openIt();
    expect(screen.getByRole("dialog", { name: "Invoice 1042" })).toBeInTheDocument();
    expect(screen.getByText("Northgate Foods")).toBeInTheDocument();
    const list = within(dialog).getByRole("list");
    expect(within(list).getAllByRole("button").map((b) => b.textContent)).toEqual(["Download", "Send"]);
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("is not in the page until opened", () => {
    setup();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("runs the chosen action and closes, returning focus to the trigger", async () => {
    const onAction = vi.fn();
    setup({ actions: [action("download", { onAction })] });
    const { user } = await openIt();
    await user.click(screen.getByRole("button", { name: "Download" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus();
  });

  it("closes with Cancel, calls onCancel and runs no action", async () => {
    const onCancel = vi.fn();
    const onAction = vi.fn();
    setup({ onCancel, actions: [action("download", { onAction })] });
    const { user } = await openIt();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onAction).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes with Escape without running anything", async () => {
    const onAction = vi.fn();
    setup({ actions: [action("download", { onAction })] });
    const { user } = await openIt();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onAction).not.toHaveBeenCalled();
  });

  it("can leave out the Cancel button", async () => {
    setup({ showCancel: false });
    await openIt();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  describe("the list", () => {
    it("draws icons as decoration and the description under the label", async () => {
      setup({ actions: [action("send", { icon: <svg data-testid="icon" />, description: "To the customer" })] });
      await openIt();
      expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByRole("button", { name: /Send/ })).toHaveTextContent("To the customer");
    });

    it("sizes every action for touch", async () => {
      setup();
      const { dialog } = await openIt();
      for (const button of within(within(dialog).getByRole("list")).getAllByRole("button")) expect(button.className).toContain("min-h-12");
    });

    it("draws a danger action in the danger color", async () => {
      setup({ actions: [action("delete", { tone: "danger" }), action("send")] });
      await openIt();
      expect(screen.getByRole("button", { name: "Delete" }).className).toContain("feedback-danger");
      expect(screen.getByRole("button", { name: "Send" }).className).not.toContain("feedback-danger");
    });

    it("moves between the actions with the arrow keys, wrapping, and with Home and End", async () => {
      setup({ actions: [action("one"), action("two"), action("three")] });
      const { user } = await openIt();
      screen.getByRole("button", { name: "One" }).focus();
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("button", { name: "Two" })).toHaveFocus();
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(screen.getByRole("button", { name: "One" })).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(screen.getByRole("button", { name: "Three" })).toHaveFocus();
      await user.keyboard("{Home}");
      expect(screen.getByRole("button", { name: "One" })).toHaveFocus();
      await user.keyboard("{End}");
      expect(screen.getByRole("button", { name: "Three" })).toHaveFocus();
    });

    it("chooses the focused action with Enter and Space", async () => {
      const first = vi.fn();
      const second = vi.fn();
      setup({ actions: [action("one", { onAction: first }), action("two", { onAction: second })] });
      const { user } = await openIt();
      screen.getByRole("button", { name: "One" }).focus();
      await user.keyboard("{Enter}");
      expect(first).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));
      await screen.findByRole("dialog");
      screen.getByRole("button", { name: "Two" }).focus();
      await user.keyboard(" ");
      expect(second).toHaveBeenCalledTimes(1);
    });
  });

  describe("confirm", () => {
    const withConfirm = (onAction = vi.fn()) => setup({ actions: [action("delete", { tone: "danger", onAction, confirm: { description: "This cannot be undone.", confirmLabel: "Yes, delete" } })] });

    it("asks once more and runs nothing yet", async () => {
      const onAction = vi.fn();
      withConfirm(onAction);
      const { user } = await openIt();
      await user.click(screen.getByRole("button", { name: "Delete" }));
      expect(onAction).not.toHaveBeenCalled();
      const group = screen.getByRole("group", { name: "Delete" });
      expect(within(group).getByText("This cannot be undone.")).toBeInTheDocument();
      expect(within(group).getByRole("button", { name: "Yes, delete" })).toBeInTheDocument();
      expect(within(group).getByRole("button", { name: "Back" })).toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("moves focus into the confirmation", async () => {
      withConfirm();
      const { user } = await openIt();
      await user.click(screen.getByRole("button", { name: "Delete" }));
      expect(screen.getByRole("heading", { name: "Delete" })).toHaveFocus();
    });

    it("runs the action on the confirm button and closes", async () => {
      const onAction = vi.fn();
      withConfirm(onAction);
      const { user } = await openIt();
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await user.click(screen.getByRole("button", { name: "Yes, delete" }));
      expect(onAction).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("goes back to the list with Back and puts focus on the action that was chosen", async () => {
      const onAction = vi.fn();
      withConfirm(onAction);
      const { user } = await openIt();
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await user.click(screen.getByRole("button", { name: "Back" }));
      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
      expect(onAction).not.toHaveBeenCalled();
    });

    it("goes back with Escape instead of closing the sheet", async () => {
      withConfirm();
      const { user } = await openIt();
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await user.keyboard("{Escape}");
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("list")).toBeInTheDocument();
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("confirms with the action's own label when none is given", async () => {
      setup({ actions: [action("void", { label: "Void invoice", confirm: {} })] });
      const { user } = await openIt();
      await user.click(screen.getByRole("button", { name: "Void invoice" }));
      expect(within(screen.getByRole("group")).getByRole("button", { name: "Void invoice" })).toBeInTheDocument();
    });
  });

  describe("actions that wait", () => {
    it("shows the action working, makes the others inactive and closes when it succeeds", async () => {
      const d = deferred();
      const other = vi.fn();
      setup({ actions: [action("send", { onAction: () => d.promise }), action("other", { onAction: other })] });
      const { user } = await openIt();
      await user.click(screen.getByRole("button", { name: "Send" }));
      expect(screen.getByRole("list")).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("data-working");
      expect(screen.getByRole("button", { name: "Other" })).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("status")).toHaveTextContent("Working");
      await user.click(screen.getByRole("button", { name: "Other" }));
      expect(other).not.toHaveBeenCalled();
      d.resolve();
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("does not run the same action twice", async () => {
      const d = deferred();
      const onAction = vi.fn(() => d.promise);
      setup({ actions: [action("send", { onAction })] });
      const { user } = await openIt();
      await user.click(screen.getByRole("button", { name: "Send" }));
      await user.click(screen.getByRole("button", { name: "Send" }));
      expect(onAction).toHaveBeenCalledTimes(1);
      d.resolve();
    });

    it("stays open with an alert when it fails, calls onError and can be tried again", async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      const error = new Error("offline");
      const onAction = vi.fn().mockRejectedValueOnce(error).mockResolvedValue(undefined);
      const send = action("send", { onAction });
      setup({ actions: [send], onError });
      await user.click(screen.getByRole("button", { name: "Open" }));
      await screen.findByRole("dialog");
      await user.click(screen.getByRole("button", { name: "Send" }));
      expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong. Try again.");
      expect(onError).toHaveBeenCalledWith(error, send);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("list")).not.toHaveAttribute("aria-busy");
      await user.click(screen.getByRole("button", { name: "Send" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(onAction).toHaveBeenCalledTimes(2);
    });

    it("shows the failure of a confirmed action back in the list", async () => {
      setup({ actions: [action("delete", { onAction: () => Promise.reject(new Error("x")), confirm: { confirmLabel: "Delete now" } })] });
      const { user } = await openIt();
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await user.click(screen.getByRole("button", { name: "Delete now" }));
      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("list")).toBeInTheDocument();
    });

    it("treats an action that throws at once as a failure", async () => {
      const onError = vi.fn();
      setup({
        onError,
        actions: [
          action("send", {
            onAction: () => {
              throw new Error("sync");
            },
          }),
        ],
      });
      const { user } = await openIt();
      await user.click(screen.getByRole("button", { name: "Send" }));
      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe("permissions", () => {
    it("does not draw a hidden action", async () => {
      setup({ actions: [action("send"), action("delete", { permission: "hidden" })] });
      await openIt();
      expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    });

    it("keeps a disabled action focusable, inactive and explained", async () => {
      const onAction = vi.fn();
      setup({ actions: [action("void", { onAction, permission: { state: "disabled", reason: "Only finance can void" } })] });
      const { user } = await openIt();
      const button = screen.getByRole("button", { name: /Void/ });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAccessibleDescription("Only finance can void");
      expect(screen.getByText("Only finance can void")).toBeInTheDocument();
      await user.click(button);
      expect(onAction).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("does not confirm a disabled action", async () => {
      setup({ actions: [action("void", { permission: false, confirm: { description: "Sure?" } })] });
      const { user } = await openIt();
      await user.click(screen.getByRole("button", { name: "Void" }));
      expect(screen.queryByText("Sure?")).not.toBeInTheDocument();
    });
  });

  it("takes every word it adds from labels", async () => {
    setup({ labels: { cancel: "Cancelar", back: "Atrás" }, actions: [action("delete", { confirm: {} })] });
    const { user } = await openIt();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "Atrás" })).toBeInTheDocument();
  });

  it("can be controlled with isOpen and onOpenChange", async () => {
    const onOpenChange = vi.fn();
    render(<ActionSheet isOpen onOpenChange={onOpenChange} title="Controlled" actions={[action("send")]} />);
    expect(await screen.findByRole("dialog", { name: "Controlled" })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("is named by aria-label when there is no title", async () => {
    render(<ActionSheet isOpen aria-label="Actions for the invoice" actions={[action("send")]} />);
    expect(await screen.findByRole("dialog", { name: "Actions for the invoice" })).toBeInTheDocument();
  });

  it("adds slot classNames after the built-in ones", async () => {
    setup({ classNames: { list: "l", action: "a", cancel: "c" } });
    const { dialog } = await openIt();
    expect(dialog.querySelector("ul")).toHaveClass("l");
    expect(screen.getByRole("button", { name: "Download" })).toHaveClass("a");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass("c");
  });

  it("has no accessibility violations in the list, the confirmation, while working and after a failure", async () => {
    const d = deferred();
    setup({
      actions: [
        action("pdf", { icon: <svg aria-hidden="true" /> }),
        action("void", { permission: { state: "disabled", reason: "Only finance" } }),
        action("delete", { tone: "danger", confirm: { description: "Sure?" } }),
        action("slow", { onAction: () => d.promise }),
      ],
    });
    const { user, dialog } = await openIt();
    expect(await axeViolations(dialog)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(await axeViolations(dialog)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Slow" }));
    expect(await axeViolations(dialog)).toEqual([]);
    d.reject(new Error("x"));
    await screen.findByRole("alert");
    expect(await axeViolations(dialog)).toEqual([]);
  });
});
