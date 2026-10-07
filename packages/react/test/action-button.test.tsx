import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActionButton, useAction } from "../src";
import { axeViolations } from "./axe";

function deferred<T = void>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("ActionButton permission", () => {
  it("runs the action when allowed (the default)", async () => {
    const onAction = vi.fn();
    render(<ActionButton onAction={onAction}>Send</ActionButton>);
    await userEvent.setup().click(screen.getByRole("button", { name: "Send" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when hidden", () => {
    const { container } = render(
      <ActionButton permission="hidden" onAction={() => {}}>
        Send
      </ActionButton>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("is a normal disabled button when disabled without a reason", async () => {
    const onAction = vi.fn();
    render(
      <ActionButton permission={false} onAction={onAction}>
        Send
      </ActionButton>,
    );
    const button = screen.getByRole("button", { name: "Send" });
    expect(button).toBeDisabled();
    await userEvent.setup().click(button);
    expect(onAction).not.toHaveBeenCalled();
  });

  it("stays focusable with a reason, explains it, and does not run", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <ActionButton permission={{ state: "disabled", reason: "Only admins can send" }} onAction={onAction}>
        Send
      </ActionButton>,
    );
    const button = screen.getByRole("button", { name: "Send" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAccessibleDescription("Only admins can send");
    await user.tab();
    expect(button).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Only admins can send");
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    await user.click(button);
    expect(onAction).not.toHaveBeenCalled();
  });
});

describe("ActionButton confirm", () => {
  const confirm = { title: "Delete this user?", description: "This cannot be undone.", confirmLabel: "Delete" };

  it("Cancel does nothing; Confirm runs once and closes", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <ActionButton variant="danger" confirm={confirm} onAction={onAction}>
        Delete user
      </ActionButton>,
    );
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    await screen.findByRole("alertdialog", { name: "Delete this user?" });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(onAction).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete user" }));
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("uses the danger tone for a danger button (focus starts on Cancel)", async () => {
    const user = userEvent.setup();
    render(
      <ActionButton variant="danger" confirm={confirm} onAction={() => {}}>
        Delete user
      </ActionButton>,
    );
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    await screen.findByRole("alertdialog");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("makes the person type the word first", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <ActionButton variant="danger" confirm={{ ...confirm, confirmText: "Northwind" }} onAction={onAction}>
        Delete project
      </ActionButton>,
    );
    await user.click(screen.getByRole("button", { name: "Delete project" }));
    await screen.findByRole("alertdialog");
    const confirmButton = screen.getByRole("button", { name: "Delete" });
    expect(confirmButton).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: /Northwind/ }), "Northwind");
    await user.click(confirmButton);
    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
  });

  it("closes the dialog on error and reports it", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    const boom = new Error("nope");
    render(
      <ActionButton
        confirm={confirm}
        onAction={async () => {
          throw boom;
        }}
        onError={onError}
        errorMessage="Could not delete"
      >
        Delete user
      </ActionButton>,
    );
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(onError).toHaveBeenCalledWith(boom);
    expect(screen.getByRole("status")).toHaveTextContent("Could not delete");
  });
});

describe("ActionButton pending and results", () => {
  it("shows pending, ignores a second press, then announces success", async () => {
    const user = userEvent.setup();
    const gate = deferred<string>();
    const onAction = vi.fn(() => gate.promise);
    const onSuccess = vi.fn();
    const states: string[] = [];
    render(
      <ActionButton onAction={onAction} onSuccess={onSuccess} onStateChange={(s) => states.push(s)} successMessage="Sent">
        Send
      </ActionButton>,
    );
    const button = screen.getByRole("button", { name: "Send" });
    await user.click(button);
    expect(button).toHaveAttribute("aria-disabled", "true");
    await user.click(button);
    button.focus();
    await user.keyboard("{Enter}");
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    await act(async () => gate.resolve("ok"));
    expect(onSuccess).toHaveBeenCalledWith("ok");
    expect(screen.getByRole("status")).toHaveTextContent("Sent");
    expect(states).toEqual(["pending", "success"]);
    expect(button).not.toHaveAttribute("aria-disabled", "true");
  });

  it("announces failure, calls onError, and goes back to idle on the next press", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn().mockRejectedValueOnce(new Error("bad")).mockResolvedValueOnce(undefined);
    const onError = vi.fn();
    const states: string[] = [];
    render(
      <ActionButton onAction={onAction} onError={onError} onStateChange={(s) => states.push(s)} errorMessage="Failed" successMessage="Done">
        Send
      </ActionButton>,
    );
    await user.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Failed"));
    expect(onError).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Done"));
    expect(states).toEqual(["pending", "error", "pending", "success"]);
  });

  it("treats a synchronous throw as an error too", async () => {
    const onError = vi.fn();
    render(
      <ActionButton
        onAction={() => {
          throw new Error("sync");
        }}
        onError={onError}
      >
        Send
      </ActionButton>,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
  });

  it("runs once for Enter and once for Space", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<ActionButton onAction={onAction}>Send</ActionButton>);
    await user.tab();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
    await user.keyboard(" ");
    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(2));
  });
});

describe("useAction", () => {
  function Harness({ onAction }: { onAction: () => Promise<unknown> }) {
    const { state, run, isPending } = useAction(onAction);
    return (
      <button onClick={() => void run()}>
        {state}:{String(isPending)}
      </button>
    );
  }

  it("moves through the states", async () => {
    const gate = deferred();
    render(<Harness onAction={() => gate.promise} />);
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("idle:false");
    act(() => button.click());
    expect(button).toHaveTextContent("pending:true");
    await act(async () => gate.resolve());
    expect(button).toHaveTextContent("success:false");
  });
});

describe("ActionButton accessibility and server rendering", () => {
  it("has no axe violations in any state", async () => {
    const { container, unmount } = render(
      <div>
        <ActionButton onAction={() => {}} icon={<span>+</span>} successMessage="Done">
          Allowed
        </ActionButton>
        <ActionButton permission={{ state: "disabled", reason: "Only admins" }} onAction={() => {}}>
          Reasoned
        </ActionButton>
        <ActionButton permission={false} onAction={() => {}}>
          Plain disabled
        </ActionButton>
        <ActionButton permission="hidden" onAction={() => {}}>
          Hidden
        </ActionButton>
        <ActionButton variant="danger" confirm={{ title: "Sure?" }} onAction={() => {}}>
          Confirmed
        </ActionButton>
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
    unmount();

    const gate = deferred();
    const user = userEvent.setup();
    render(
      <ActionButton variant="danger" confirm={{ title: "Delete?", description: "Gone for good." }} onAction={() => gate.promise}>
        Delete
      </ActionButton>,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await screen.findByRole("alertdialog");
    expect(await axeViolations(screen.getByRole("alertdialog"))).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await axeViolations(screen.getByRole("alertdialog"))).toEqual([]);
    await act(async () => gate.resolve());
  });

  it("renders on the server", () => {
    const html = renderToString(
      <ActionButton permission={{ state: "disabled", reason: "Only admins" }} onAction={() => {}}>
        Send
      </ActionButton>,
    );
    expect(html).toContain("Send");
    expect(html).toContain("Only admins");
    expect(renderToString(<ActionButton onAction={() => {}}>Go</ActionButton>)).toContain("Go");
  });
});
