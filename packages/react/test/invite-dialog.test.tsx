import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Button, DialogTrigger, InviteDialog, type InviteDialogProps } from "../src";
import { axeViolations } from "./axe";

const roles = [
  { id: "viewer", label: "Viewer", description: "Can read everything." },
  { id: "editor", label: "Editor", description: "Can change records." },
];

function Trigger(props: Partial<InviteDialogProps>) {
  return (
    <DialogTrigger>
      <Button>Invite people</Button>
      <InviteDialog roles={roles} onInvite={() => {}} {...props} />
    </DialogTrigger>
  );
}

async function open(u: ReturnType<typeof userEvent.setup>) {
  await u.click(screen.getByRole("button", { name: "Invite people" }));
  return screen.findByRole("dialog");
}

const emails = () => screen.getAllByLabelText(/^Email/) as HTMLInputElement[];

describe("InviteDialog", () => {
  it("opens from a trigger with the title, a first row and focus on the first email", async () => {
    const u = userEvent.setup();
    render(<Trigger description="They get an email." />);
    const dialog = await open(u);
    expect(within(dialog).getByRole("heading", { name: "Invite people" })).toBeInTheDocument();
    expect(within(dialog).getByRole("group", { name: "Invitation 1" })).toBeInTheDocument();
    await waitFor(() => expect(emails()[0]).toHaveFocus());
    expect(within(dialog).getByRole("button", { name: "Send invitation" })).toBeInTheDocument();
  });

  it("sends the typed rows to onInvite, trims them and shows the count on the button", async () => {
    const onInvite = vi.fn();
    const u = userEvent.setup();
    render(<Trigger onInvite={onInvite} />);
    await open(u);
    await u.type(emails()[0], " amara.okafor@example.com ");
    await u.click(screen.getByRole("button", { name: "Add another" }));
    await waitFor(() => expect(emails()).toHaveLength(2));
    await u.type(emails()[1], "tomas.novak@example.com");
    await u.type(screen.getByLabelText("Message (optional)"), "Welcome aboard");
    await u.click(screen.getByRole("button", { name: "Send 2 invitations" }));
    await waitFor(() => expect(onInvite).toHaveBeenCalledTimes(1));
    expect(onInvite).toHaveBeenCalledWith(
      [
        { email: "amara.okafor@example.com", role: "viewer" },
        { email: "tomas.novak@example.com", role: "viewer" },
      ],
      { message: "Welcome aboard" },
    );
  });

  it("starts rows on defaultRole and shows the description of the role", async () => {
    const u = userEvent.setup();
    render(<Trigger defaultRole="editor" />);
    await open(u);
    expect(screen.getByText("Can change records.")).toBeInTheDocument();
  });

  it("stops at maxInvites and says so", async () => {
    const u = userEvent.setup();
    render(<Trigger maxInvites={2} />);
    await open(u);
    await u.click(screen.getByRole("button", { name: "Add another" }));
    const add = screen.getByRole("button", { name: "Add another" });
    expect(add).toBeDisabled();
    expect(screen.getByText("You can invite up to 2 people at once.")).toBeInTheDocument();
    expect(emails()).toHaveLength(2);
  });

  it("checks the email format, duplicates inside the list and existing members", async () => {
    const onInvite = vi.fn();
    const u = userEvent.setup();
    render(<Trigger onInvite={onInvite} existingEmails={["Lena.Fischer@example.com"]} />);
    await open(u);
    await u.type(emails()[0], "not-an-email");
    await u.click(screen.getByRole("button", { name: "Add another" }));
    await waitFor(() => expect(emails()).toHaveLength(2));
    await u.type(emails()[1], "lena.fischer@example.com");
    await u.click(screen.getByRole("button", { name: "Add another" }));
    await waitFor(() => expect(emails()).toHaveLength(3));
    await u.type(emails()[2], "lena.fischer@example.com");
    await u.click(screen.getByRole("button", { name: "Send 3 invitations" }));

    const summary = await screen.findByRole("region", { name: /problem|fix|error/i });
    expect(within(summary).getByText(/Enter a valid email address/)).toBeInTheDocument();
    expect(onInvite).not.toHaveBeenCalled();
    expect(emails()[0]).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByText(/is already a member/).length).toBeGreaterThanOrEqual(2);
  });

  it("flags the second of two equal addresses, compared without case", async () => {
    const u = userEvent.setup();
    render(<Trigger />);
    await open(u);
    await u.type(emails()[0], "Priya.Raman@example.com");
    await u.click(screen.getByRole("button", { name: "Add another" }));
    await waitFor(() => expect(emails()).toHaveLength(2));
    await u.type(emails()[1], "priya.raman@example.com");
    await u.click(screen.getByRole("button", { name: "Send 2 invitations" }));
    await waitFor(() => expect(emails()[1]).toHaveAttribute("aria-invalid", "true"));
    expect(emails()[0]).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByText("priya.raman@example.com is already in this list.").length).toBeGreaterThan(0);
  });

  it("asks for an email on an empty row", async () => {
    const onInvite = vi.fn();
    const u = userEvent.setup();
    render(<Trigger onInvite={onInvite} />);
    await open(u);
    await u.click(screen.getByRole("button", { name: "Send invitation" }));
    expect((await screen.findAllByText("Email is required")).length).toBeGreaterThan(0);
    expect(onInvite).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("region", { name: /./ })).toHaveFocus());
  });

  it("closes after a send that worked, says so, and returns focus to the trigger", async () => {
    const u = userEvent.setup();
    render(<Trigger onInvite={async () => {}} />);
    await open(u);
    await u.type(emails()[0], "lena.fischer@example.com");
    await u.click(screen.getByRole("button", { name: "Send invitation" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("1 invitation sent");
    await waitFor(() => expect(screen.getByRole("button", { name: "Invite people" })).toHaveFocus());
  });

  it("uses your own count texts", async () => {
    const u = userEvent.setup();
    render(<Trigger submitLabel={(n) => `Invite ${n}`} successMessage={(n) => `Done: ${n}`} />);
    await open(u);
    await u.type(emails()[0], "lena.fischer@example.com");
    await u.click(screen.getByRole("button", { name: "Invite 1" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("Done: 1");
  });

  it("shows a server error on its row and stays open", async () => {
    const onOpenChange = vi.fn();
    const u = userEvent.setup();
    render(
      <Trigger
        onOpenChange={onOpenChange}
        onInvite={async () => ({ fieldErrors: { "invites[0].email": "tomas.novak@example.com belongs to another workspace." } })}
      />,
    );
    await open(u);
    await u.type(emails()[0], "tomas.novak@example.com");
    await u.click(screen.getByRole("button", { name: "Send invitation" }));
    await waitFor(() => expect(emails()[0]).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getAllByText("tomas.novak@example.com belongs to another workspace.").length).toBeGreaterThan(0);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("stays open with a message when onInvite throws", async () => {
    const u = userEvent.setup();
    render(
      <Trigger
        onInvite={async () => {
          throw new Error("down");
        }}
      />,
    );
    await open(u);
    await u.type(emails()[0], "lena.fischer@example.com");
    await u.click(screen.getByRole("button", { name: "Send invitation" }));
    expect(await screen.findByText("We could not complete that. Try again.")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("cancels with the button and with Escape", async () => {
    const onCancel = vi.fn();
    const u = userEvent.setup();
    render(<Trigger onCancel={onCancel} />);
    await open(u);
    await u.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByRole("button", { name: "Invite people" })).toHaveFocus());

    await open(u);
    await u.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("works without a trigger when it is controlled with isOpen", async () => {
    const onInvite = vi.fn();
    function Controlled() {
      const [isOpen, setOpen] = useState(true);
      return <InviteDialog roles={roles} isOpen={isOpen} onOpenChange={setOpen} onInvite={onInvite} />;
    }
    const u = userEvent.setup();
    render(<Controlled />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await u.type(emails()[0], "lena.fischer@example.com");
    await u.keyboard("{Enter}");
    await waitFor(() => expect(onInvite).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("can drop the message field", async () => {
    const u = userEvent.setup();
    render(<Trigger showMessage={false} />);
    await open(u);
    expect(screen.queryByLabelText("Message (optional)")).not.toBeInTheDocument();
  });

  it("removes a row from the keyboard and keeps the count on the button", async () => {
    const u = userEvent.setup();
    render(<Trigger />);
    await open(u);
    await u.click(screen.getByRole("button", { name: "Add another" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Send 2 invitations" })).toBeInTheDocument());
    await u.click(screen.getByRole("button", { name: "Remove invitation 2" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Send invitation" })).toBeInTheDocument());
  });

  describe("permissions", () => {
    it("renders nothing when invite is hidden", () => {
      const { container } = render(<InviteDialog roles={roles} isOpen onInvite={() => {}} permissions={{ invite: "hidden" }} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("keeps a disabled send reachable with the reason as its description, and sends nothing", async () => {
      const onInvite = vi.fn();
      const u = userEvent.setup();
      render(<Trigger onInvite={onInvite} permissions={{ invite: { state: "disabled", reason: "Your plan allows 5 members." } }} />);
      await open(u);
      const send = screen.getByRole("button", { name: "Send invitation" });
      expect(send).toHaveAttribute("aria-disabled", "true");
      expect(send).not.toBeDisabled();
      expect(send).toHaveAccessibleDescription("Your plan allows 5 members.");
      await u.type(emails()[0], "lena.fischer@example.com");
      await u.click(send);
      await u.keyboard("{Enter}");
      expect(onInvite).not.toHaveBeenCalled();
    });

    it("blocks Enter in a field when invite is disabled", async () => {
      const onInvite = vi.fn();
      const u = userEvent.setup();
      render(<Trigger onInvite={onInvite} permissions={{ invite: false }} />);
      await open(u);
      await u.type(emails()[0], "lena.fischer@example.com{Enter}");
      expect(onInvite).not.toHaveBeenCalled();
    });
  });

  it("applies classNames to its parts", async () => {
    const u = userEvent.setup();
    render(
      <Trigger
        permissions={{ invite: { state: "disabled", reason: "Why" } }}
        classNames={{ dialog: "c-dialog", form: "c-form", list: "c-list", message: "c-message", actions: "c-actions", cancelButton: "c-cancel", submitButton: "c-submit", reason: "c-reason", status: "c-status" }}
      />,
    );
    await open(u);
    for (const name of ["c-dialog", "c-form", "c-list", "c-message", "c-actions", "c-cancel", "c-submit", "c-reason", "c-status"]) {
      expect(document.querySelector(`.${name}`), name).not.toBeNull();
    }
  });

  it("has no axe violations open, with errors, and in the disabled state", async () => {
    const u = userEvent.setup();
    render(<Trigger />);
    await open(u);
    expect(await axeViolations()).toEqual([]);
    await u.click(screen.getByRole("button", { name: "Send invitation" }));
    await screen.findAllByText("Email is required");
    expect(await axeViolations()).toEqual([]);
  });

  it("has no axe violations with the send disabled", async () => {
    const u = userEvent.setup();
    render(<Trigger permissions={{ invite: { state: "disabled", reason: "Not on your plan." } }} />);
    await open(u);
    expect(await axeViolations()).toEqual([]);
  });

  it("renders on the server without opening", () => {
    const html = renderToString(<Trigger />);
    expect(html).toContain("Invite people");
    expect(html).not.toContain('role="dialog"');
  });
});
