import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Sheet, UserForm, type UserFormProps } from "../src";
import { axeViolations } from "./axe";

const roles = [
  { id: "viewer", label: "Viewer", description: "Can read everything." },
  { id: "editor", label: "Editor", description: "Can change records." },
  { id: "admin", label: "Admin", description: "Can manage members." },
];
const teams = [
  { id: "support", label: "Support" },
  { id: "finance", label: "Finance" },
];
const lena = { name: "Lena Fischer", email: "lena.fischer@example.com", role: "editor", status: "active" as const, team: "finance" };

const noExtras = { avatar: false, jobTitle: false, phone: false, address: false, preferences: false, bio: false };

function Edit(props: Partial<UserFormProps>) {
  return <UserForm mode="edit" variant="sheet" fields={noExtras} roles={roles} teams={teams} defaultValues={lena} onSubmit={() => {}} onCancel={() => {}} {...props} />;
}

const save = () => screen.getByRole("button", { name: /^(Save changes|Create user)$/ });

describe("UserForm", () => {
  describe("create", () => {
    it("starts empty, needs a name, email and role, and sends the values", async () => {
      const onSubmit = vi.fn();
      const u = userEvent.setup();
      render(<UserForm variant="modal" roles={roles} teams={teams} onSubmit={onSubmit} />);
      expect(save()).toBeDisabled();
      await u.type(screen.getByLabelText(/^Name/), "Tomas Novak");
      await u.type(screen.getByLabelText(/^Email/), "tomas.novak@example.com");
      await u.click(save());
      // The role is still empty.
      expect(await screen.findAllByText(/Role is required/)).not.toHaveLength(0);
      expect(onSubmit).not.toHaveBeenCalled();
      await u.click(screen.getByRole("button", { name: /Role/ }));
      await u.click(await screen.findByRole("option", { name: "Editor" }));
      await u.click(save());
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit).toHaveBeenCalledWith({ name: "Tomas Novak", email: "tomas.novak@example.com", role: "editor", status: "active", team: null });
    });

    it("checks the email format", async () => {
      const onSubmit = vi.fn();
      const u = userEvent.setup();
      render(<UserForm variant="modal" roles={roles} defaultValues={{ role: "viewer" }} onSubmit={onSubmit} />);
      await u.type(screen.getByLabelText(/^Name/), "Tomas");
      await u.type(screen.getByLabelText(/^Email/), "nope");
      await u.click(save());
      expect((await screen.findAllByText("Enter a valid email address.")).length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/^Email/)).toHaveAttribute("aria-invalid", "true");
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("has no danger zone and leaves the team out when there are no teams", () => {
      render(<UserForm variant="modal" roles={roles} onSubmit={() => {}} onDelete={() => {}} />);
      expect(screen.queryByRole("group", { name: "Danger zone" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Team/ })).not.toBeInTheDocument();
    });

    it("shows the description of the chosen role", () => {
      render(<UserForm variant="modal" roles={roles} defaultValues={{ role: "admin" }} onSubmit={() => {}} />);
      expect(screen.getByText("Can manage members.")).toBeInTheDocument();
    });
  });

  describe("edit", () => {
    it("shows the values, with a read-only email and a hint", () => {
      render(<Edit />);
      expect(screen.getByLabelText(/^Name/)).toHaveValue("Lena Fischer");
      const email = screen.getByLabelText(/^Email/);
      expect(email).toHaveValue("lena.fischer@example.com");
      expect(email).toHaveAttribute("readonly");
      expect(email).toHaveAccessibleDescription("Email cannot be changed here.");
      expect(screen.getByRole("switch", { name: "Active" })).toBeChecked();
    });

    it("keeps Save disabled until something changes, and again when it is changed back", async () => {
      const u = userEvent.setup();
      render(<Edit />);
      expect(save()).toBeDisabled();
      const name = screen.getByLabelText(/^Name/);
      await u.type(name, "x");
      expect(save()).toBeEnabled();
      await u.type(name, "{Backspace}");
      expect(save()).toBeDisabled();
    });

    it("saves the changes, shows a message, and is clean again", async () => {
      const onSubmit = vi.fn();
      const u = userEvent.setup();
      render(<Edit onSubmit={onSubmit} />);
      await u.click(screen.getByRole("switch", { name: "Active" }));
      await u.click(save());
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ ...lena, status: "suspended" }));
      expect(await screen.findByText("User saved.")).toBeInTheDocument();
      expect(save()).toBeDisabled();
    });

    it("sends a null team for No team", async () => {
      const onSubmit = vi.fn();
      const u = userEvent.setup();
      render(<Edit onSubmit={onSubmit} />);
      await u.click(screen.getByRole("button", { name: /Team/ }));
      await u.click(await screen.findByRole("option", { name: "No team" }));
      await u.click(save());
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ ...lena, team: null }));
    });

    it("shows a server error on its field and in the summary, and stays dirty", async () => {
      const u = userEvent.setup();
      render(<Edit onSubmit={async () => ({ fieldErrors: { name: "That name is reserved." } })} />);
      await u.type(screen.getByLabelText(/^Name/), "2");
      await u.click(save());
      await waitFor(() => expect(screen.getByLabelText(/^Name/)).toHaveAttribute("aria-invalid", "true"));
      expect(screen.getAllByText(/That name is reserved/).length).toBeGreaterThan(0);
      expect(save()).toBeEnabled();
      expect(screen.queryByText("User saved.")).not.toBeInTheDocument();
    });

    it("shows a form-level message when onSubmit throws", async () => {
      const u = userEvent.setup();
      render(
        <Edit
          onSubmit={async () => {
            throw new Error("offline");
          }}
        />,
      );
      await u.type(screen.getByLabelText(/^Name/), "2");
      await u.click(save());
      expect(await screen.findByText("We could not complete that. Try again.")).toBeInTheDocument();
    });

    it("shows the pending state while saving", async () => {
      const u = userEvent.setup();
      let finish: () => void = () => {};
      render(<Edit onSubmit={() => new Promise<void>((resolve) => (finish = resolve))} />);
      await u.type(screen.getByLabelText(/^Name/), "2");
      await u.click(save());
      await waitFor(() => expect(save()).toHaveAttribute("data-pending"));
      finish();
      await waitFor(() => expect(save()).not.toHaveAttribute("data-pending"));
    });
  });

  describe("discarding changes", () => {
    it("cancels at once when nothing changed", async () => {
      const onCancel = vi.fn();
      const u = userEvent.setup();
      render(<Edit onCancel={onCancel} />);
      await u.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("asks first when something changed; Keep editing goes back", async () => {
      const onCancel = vi.fn();
      const u = userEvent.setup();
      render(<Edit onCancel={onCancel} />);
      await u.type(screen.getByLabelText(/^Name/), "x");
      await u.click(screen.getByRole("button", { name: "Cancel" }));
      const dialog = await screen.findByRole("alertdialog", { name: "Discard changes?" });
      expect(onCancel).not.toHaveBeenCalled();
      await u.click(within(dialog).getByRole("button", { name: "Keep editing" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(onCancel).not.toHaveBeenCalled();
      expect(screen.getByLabelText(/^Name/)).toHaveValue("Lena Fischerx");
    });

    it("calls onCancel after Discard", async () => {
      const onCancel = vi.fn();
      const u = userEvent.setup();
      render(<Edit onCancel={onCancel} />);
      await u.type(screen.getByLabelText(/^Name/), "x");
      await u.click(screen.getByRole("button", { name: "Cancel" }));
      await u.click(await screen.findByRole("button", { name: "Discard" }));
      await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
    });

    it("asks on Escape when something changed, and does nothing when clean", async () => {
      const u = userEvent.setup();
      render(<Edit />);
      await u.click(screen.getByLabelText(/^Name/));
      await u.keyboard("{Escape}");
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      await u.keyboard("x{Escape}");
      expect(await screen.findByRole("alertdialog", { name: "Discard changes?" })).toBeInTheDocument();
    });

    it("keeps a Sheet open on Escape while there are changes", async () => {
      function InSheet() {
        const [isOpen, setOpen] = useState(true);
        return (
          <Sheet title="Edit user" isOpen={isOpen} onOpenChange={setOpen}>
            <UserForm variant="sheet" fields={noExtras} mode="edit" roles={roles} defaultValues={lena} onSubmit={() => {}} onCancel={() => setOpen(false)} />
          </Sheet>
        );
      }
      const u = userEvent.setup();
      render(<InSheet />);
      await u.type(await screen.findByLabelText(/^Name/), "x{Escape}");
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByRole("dialog", { hidden: true })).toBeInTheDocument();
      await u.click(screen.getByRole("button", { name: "Discard" }));
      await waitFor(() => expect(screen.queryByLabelText(/^Name/)).not.toBeInTheDocument());
    });

    it("is not dirty again after a save, so Cancel needs no question", async () => {
      const onCancel = vi.fn();
      const u = userEvent.setup();
      render(<Edit onCancel={onCancel} />);
      await u.type(screen.getByLabelText(/^Name/), "x");
      await u.click(save());
      await screen.findByText("User saved.");
      await u.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  describe("danger zone", () => {
    it("asks before deleting and then calls onDelete", async () => {
      const onDelete = vi.fn();
      const u = userEvent.setup();
      render(<Edit onDelete={onDelete} />);
      const zone = screen.getByRole("group", { name: "Danger zone" });
      await u.click(within(zone).getByRole("button", { name: "Delete user" }));
      const dialog = await screen.findByRole("alertdialog", { name: "Delete this user?" });
      expect(onDelete).not.toHaveBeenCalled();
      await u.click(within(dialog).getByRole("button", { name: "Delete user" }));
      await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    });

    it("asks before suspending, and Cancel does nothing", async () => {
      const onSuspend = vi.fn();
      const u = userEvent.setup();
      render(<Edit onSuspend={onSuspend} />);
      await u.click(screen.getByRole("button", { name: "Suspend" }));
      const dialog = await screen.findByRole("alertdialog", { name: "Suspend this user?" });
      await u.click(within(dialog).getByRole("button", { name: "Cancel" }));
      expect(onSuspend).not.toHaveBeenCalled();
    });

    it("renders the dangerZone slot", () => {
      render(<Edit dangerZone={<button type="button">Reset password</button>} />);
      expect(within(screen.getByRole("group", { name: "Danger zone" })).getByRole("button", { name: "Reset password" })).toBeInTheDocument();
    });

    it("does not submit the form", async () => {
      const onSubmit = vi.fn();
      const u = userEvent.setup();
      render(<Edit onSubmit={onSubmit} onDelete={() => {}} />);
      await u.click(screen.getByRole("button", { name: "Delete user" }));
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("permissions", () => {
    it("renders nothing when edit is hidden", () => {
      const { container } = render(<Edit permissions={{ edit: "hidden" }} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("makes a disabled role read-only but focusable, with the reason as its description", async () => {
      const u = userEvent.setup();
      render(<Edit permissions={{ changeRole: { state: "disabled", reason: "Only owners can change roles." } }} />);
      const role = screen.getByLabelText(/^Role/);
      expect(role).toHaveAttribute("readonly");
      expect(role).toHaveValue("Editor");
      expect(role).toHaveAccessibleDescription("Only owners can change roles.");
      await u.tab();
      await u.tab();
      await u.tab();
      expect(role).toHaveFocus();
    });

    it("leaves the role out when changeRole is hidden but still submits it", async () => {
      const onSubmit = vi.fn();
      const u = userEvent.setup();
      render(<Edit permissions={{ changeRole: "hidden" }} onSubmit={onSubmit} />);
      expect(screen.queryByLabelText(/^Role/)).not.toBeInTheDocument();
      await u.type(screen.getByLabelText(/^Name/), "x");
      await u.click(save());
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ ...lena, name: "Lena Fischerx" }));
    });

    it("makes the whole form read-only when edit is disabled, with Save reachable and the reason described", async () => {
      const onSubmit = vi.fn();
      const u = userEvent.setup();
      render(<Edit onSubmit={onSubmit} onSuspend={() => {}} permissions={{ edit: { state: "disabled", reason: "This user is managed by your directory." } }} />);
      expect(screen.getByLabelText(/^Name/)).toHaveAttribute("readonly");
      expect(screen.getByRole("switch", { name: "Active" })).toHaveAttribute("aria-readonly", "true");
      const saveButton = save();
      expect(saveButton).toHaveAttribute("aria-disabled", "true");
      expect(saveButton).toHaveAccessibleDescription("This user is managed by your directory.");
      await u.click(saveButton);
      await u.type(screen.getByLabelText(/^Name/), "x{Enter}");
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Suspend" })).toHaveAttribute("aria-disabled", "true");
    });

    it("disables Delete user with a reason that can be reached, or hides it", () => {
      const { rerender } = render(<Edit onDelete={() => {}} permissions={{ delete: { state: "disabled", reason: "Only owners can delete users." } }} />);
      const button = screen.getByRole("button", { name: "Delete user" });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAccessibleDescription("Only owners can delete users.");
      rerender(<Edit onDelete={() => {}} permissions={{ delete: "hidden" }} />);
      expect(screen.queryByRole("button", { name: "Delete user" })).not.toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Danger zone" })).not.toBeInTheDocument();
    });
  });

  describe("variants and fields", () => {
    it("modal shows only the essential fields and never a danger zone", () => {
      render(<UserForm variant="modal" mode="edit" roles={roles} teams={teams} defaultValues={lena} onSubmit={() => {}} onDelete={() => {}} onSuspend={() => {}} />);
      expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
      expect(screen.getByRole("switch", { name: "Active" })).toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Danger zone" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Delete user" })).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Phone number/)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Upload picture" })).not.toBeInTheDocument();
    });

    it("page shows every section, in order, and the danger zone last", () => {
      render(<UserForm variant="page" mode="edit" roles={roles} teams={teams} defaultValues={lena} onSubmit={() => {}} onDelete={() => {}} onSuspend={() => {}} />);
      const names = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
      expect(names).toEqual(["Profile", "Contact", "Address", "Preferences", "Access", "Danger zone"]);
      expect(screen.getByLabelText(/^Street address/)).toHaveAttribute("autocomplete", "street-address");
      expect(screen.getByLabelText(/^Postal code/)).toHaveAttribute("autocomplete", "postal-code");
      expect(screen.getByLabelText(/^Phone number/)).toHaveAttribute("autocomplete", "tel-national");
      expect(screen.getByLabelText(/^Phone number/)).toHaveAttribute("type", "tel");
    });

    it("fields turns parts off and on", () => {
      render(<UserForm variant="page" fields={{ address: false, preferences: false, bio: false, phone: false }} roles={roles} onSubmit={() => {}} />);
      expect(screen.queryByLabelText(/^Street address/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^Short bio/)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/^Job title/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Upload picture" })).toBeInTheDocument();
    });

    it("checks the phone number and the postal code", async () => {
      const onSubmit = vi.fn();
      const u = userEvent.setup();
      render(<UserForm variant="page" roles={roles} defaultValues={{ name: "Ana", email: "ana@example.com", role: "viewer" }} onSubmit={onSubmit} />);
      await u.type(screen.getByLabelText(/^Phone number/), "12ab");
      await u.type(screen.getByLabelText(/^Postal code/), "!");
      await u.click(save());
      expect((await screen.findAllByText("Use digits, spaces, dashes and brackets only.")).length).toBeGreaterThan(0);
      expect(screen.getAllByText("Enter a valid postal code.").length).toBeGreaterThan(0);
      expect(onSubmit).not.toHaveBeenCalled();
      await u.clear(screen.getByLabelText(/^Phone number/));
      await u.type(screen.getByLabelText(/^Phone number/), "415 555 0132");
      await u.clear(screen.getByLabelText(/^Postal code/));
      await u.type(screen.getByLabelText(/^Postal code/), "94107");
      await u.click(save());
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0]).toMatchObject({ phoneCountry: "US", phone: "415 555 0132", postalCode: "94107" });
    });

    it("counts the bio and refuses a bio that is too long", async () => {
      const u = userEvent.setup();
      render(<UserForm variant="page" roles={roles} defaultValues={{ name: "Ana", email: "ana@example.com", role: "viewer", bio: "x".repeat(281) }} onSubmit={() => {}} />);
      expect(screen.getByLabelText(/^Short bio/)).toHaveAccessibleDescription("281 of 280 characters");
      await u.type(screen.getByLabelText(/^Name/), "a");
      await u.click(save());
      expect((await screen.findAllByText("Keep the bio to 280 characters or fewer.")).length).toBeGreaterThan(0);
    });
  });

  describe("profile picture", () => {
    const pick = (file: File) => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      return userEvent.upload(input, file, { applyAccept: false });
    };

    it("takes a picture, announces it, and removes it again", async () => {
      const u = userEvent.setup();
      render(<UserForm variant="sheet" roles={roles} defaultValues={{ name: "Ana", email: "ana@example.com", role: "viewer" }} onSubmit={() => {}} />);
      expect(screen.getByRole("button", { name: "Upload picture" })).toHaveAccessibleDescription(/up to 2 MB/);
      await pick(new File(["x"], "portrait.png", { type: "image/png" }));
      expect(await screen.findByText(/Picture selected: portrait.png/)).toBeInTheDocument();
      expect(save()).toBeEnabled();
      await u.click(screen.getByRole("button", { name: "Remove picture" }));
      expect(await screen.findByText(/Picture removed/)).toBeInTheDocument();
      expect(save()).toBeDisabled();
    });

    it("refuses a wrong type and a file over 2 MB, with a message", async () => {
      render(<UserForm variant="sheet" roles={roles} onSubmit={() => {}} />);
      await pick(new File(["x"], "notes.pdf", { type: "application/pdf" }));
      expect(await screen.findByRole("alert")).toHaveTextContent("notes.pdf is not a PNG, JPEG, WebP or GIF picture.");
      await pick(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.png", { type: "image/png" }));
      expect(await screen.findByRole("alert")).toHaveTextContent("big.png is larger than 2 MB");
      expect(screen.queryByRole("button", { name: "Remove picture" })).not.toBeInTheDocument();
    });

    it("sends the file with the values", async () => {
      const onSubmit = vi.fn();
      const u = userEvent.setup();
      render(<UserForm variant="sheet" roles={roles} defaultValues={{ name: "Ana", email: "ana@example.com", role: "viewer" }} onSubmit={onSubmit} />);
      const file = new File(["x"], "portrait.png", { type: "image/png" });
      await pick(file);
      await u.click(save());
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0].avatarFile).toBe(file);
    });
  });

  describe("suspend and reinstate", () => {
    it("calls onSuspend with true, then offers Reinstate", async () => {
      const onSuspend = vi.fn();
      const u = userEvent.setup();
      render(<Edit onSuspend={onSuspend} />);
      await u.click(screen.getByRole("button", { name: "Suspend" }));
      await u.click(within(await screen.findByRole("alertdialog", { name: "Suspend this user?" })).getByRole("button", { name: "Suspend" }));
      await waitFor(() => expect(onSuspend).toHaveBeenCalledWith(true));
      expect(await screen.findByRole("button", { name: "Reinstate" })).toBeInTheDocument();
      expect(screen.getByRole("switch", { name: "Active" })).not.toBeChecked();
      expect(save()).toBeDisabled();
    });

    it("shows Reinstate for a suspended user", async () => {
      const onSuspend = vi.fn();
      const u = userEvent.setup();
      render(<Edit defaultValues={{ ...lena, status: "suspended" }} onSuspend={onSuspend} />);
      await u.click(screen.getByRole("button", { name: "Reinstate" }));
      await u.click(within(await screen.findByRole("alertdialog", { name: "Reinstate this user?" })).getByRole("button", { name: "Reinstate" }));
      await waitFor(() => expect(onSuspend).toHaveBeenCalledWith(false));
    });

    it("disables Suspend with its own permission and a reason", () => {
      render(<Edit onSuspend={() => {}} permissions={{ suspend: { state: "disabled", reason: "Only owners can suspend." } }} />);
      const button = screen.getByRole("button", { name: "Suspend" });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAccessibleDescription("Only owners can suspend.");
    });
  });

  it("has no axe violations in the page and sheet variants", async () => {
    const page = render(<UserForm variant="page" mode="edit" title="Edit" roles={roles} teams={teams} defaultValues={lena} onSubmit={() => {}} onDelete={() => {}} onSuspend={() => {}} />);
    expect(await axeViolations(page.container)).toEqual([]);
    page.unmount();
    const sheet = render(<UserForm variant="sheet" mode="edit" roles={roles} teams={teams} defaultValues={lena} onSubmit={() => {}} onDelete={() => {}} onSuspend={() => {}} />);
    expect(await axeViolations(sheet.container)).toEqual([]);
  });

  it("uses the heading level and the title", () => {
    render(<Edit title="Edit Lena Fischer" headingLevel={3} />);
    expect(screen.getByRole("heading", { level: 3, name: "Edit Lena Fischer" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Edit Lena Fischer" })).toBeInTheDocument();
  });

  it("applies classNames to its parts", () => {
    const names = ["root", "header", "title", "form", "fields", "section", "actions", "saveButton", "cancelButton", "dangerZone", "status"] as const;
    const classNames = Object.fromEntries(names.map((n) => [n, `c-${n}`])) as Record<(typeof names)[number], string>;
    render(<Edit title="Edit" onDelete={() => {}} classNames={classNames} />);
    for (const n of names.filter((n) => n !== "status")) expect(document.querySelector(`.c-${n}`), n).not.toBeNull();
  });

  it("has no axe violations in create, edit, with errors and with permissions", async () => {
    const { container, unmount } = render(<UserForm variant="modal" roles={roles} teams={teams} onSubmit={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
    unmount();
    const edit = render(<Edit title="Edit" onDelete={() => {}} onSuspend={() => {}} />);
    expect(await axeViolations(edit.container)).toEqual([]);
    edit.unmount();
    const perm = render(
      <Edit
        onDelete={() => {}}
        permissions={{ changeRole: { state: "disabled", reason: "Only owners." }, delete: { state: "disabled", reason: "Only owners." }, edit: { state: "disabled", reason: "Locked." } }}
      />,
    );
    expect(await axeViolations(perm.container)).toEqual([]);
  });

  it("has no axe violations after a failed save", async () => {
    const u = userEvent.setup();
    const { container } = render(<Edit onSubmit={async () => ({ fieldErrors: { name: "That name is reserved." } })} />);
    await u.type(screen.getByLabelText(/^Name/), "2");
    await u.click(save());
    await screen.findAllByText(/That name is reserved/);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders on the server", () => {
    const html = renderToString(<Edit onDelete={() => {}} />);
    expect(html).toContain("Lena Fischer");
    expect(html).toContain("Danger zone");
  });
});
