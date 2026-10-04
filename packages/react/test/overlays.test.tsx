import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Button,
  Dialog,
  DialogTrigger,
  Popover,
  PopoverTrigger,
  toast,
  toastQueue,
  ToastRegion,
  Tooltip,
  TooltipTrigger,
} from "../src";
import { axeViolations } from "./axe";

function ConfirmDialog({ onConfirm }: { onConfirm?: () => void }) {
  return (
    <DialogTrigger>
      <Button>Delete project</Button>
      <Dialog title="Delete project?" description="This can't be undone." role="alertdialog">
        {({ close }) => (
          <>
            <Button onPress={close}>Cancel</Button>
            <Button
              variant="danger"
              onPress={() => {
                onConfirm?.();
                close();
              }}
            >
              Delete
            </Button>
          </>
        )}
      </Dialog>
    </DialogTrigger>
  );
}

describe("Dialog", () => {
  it("moves focus in, is named by its title, and restores focus on Esc", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);
    const trigger = screen.getByRole("button", { name: "Delete project" });

    await user.click(trigger);
    const dialog = screen.getByRole("alertdialog", { name: "Delete project?" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("traps Tab inside the dialog", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);
    await user.click(screen.getByRole("button", { name: "Delete project" }));
    const dialog = screen.getByRole("alertdialog");

    for (let i = 0; i < 4; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("passes close() to render-prop children", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Delete project" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("has no axe violations when open", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);
    await user.click(screen.getByRole("button", { name: "Delete project" }));
    expect(await axeViolations()).toEqual([]);
  });
});

describe("Popover", () => {
  it("opens a labelled dialog and closes on Esc", async () => {
    const user = userEvent.setup();
    render(
      <PopoverTrigger>
        <Button>Filters</Button>
        <Popover label="Filter options">Filter controls</Popover>
      </PopoverTrigger>,
    );
    const trigger = screen.getByRole("button", { name: "Filters" });

    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Filter options" })).toHaveTextContent("Filter controls");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

describe("Tooltip", () => {
  it("shows on keyboard focus and describes the trigger", async () => {
    const user = userEvent.setup();
    render(
      <TooltipTrigger>
        <Button aria-label="Settings">⚙</Button>
        <Tooltip>Open settings</Tooltip>
      </TooltipTrigger>,
    );

    await user.tab();
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Open settings");
    expect(screen.getByRole("button", { name: "Settings" })).toHaveAttribute("aria-describedby", tooltip.id);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});

describe("Toast", () => {
  afterEach(() => {
    act(() => toastQueue.visibleToasts.forEach((t) => toastQueue.close(t.key)));
  });

  it("shows queued toasts and dismisses with the close button", async () => {
    const user = userEvent.setup();
    render(<ToastRegion />);

    act(() => {
      toast({ title: "Saved", description: "All changes stored.", variant: "success", timeout: 0 });
    });
    const item = await screen.findByRole("alertdialog", { name: "Saved" });
    expect(item).toHaveTextContent("All changes stored.");

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alertdialog", { name: "Saved" })).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    render(<ToastRegion />);
    act(() => {
      toast({ title: "Upload failed", variant: "danger", timeout: 0 });
    });
    await screen.findByRole("alertdialog", { name: "Upload failed" });
    expect(await axeViolations()).toEqual([]);
  });
});
