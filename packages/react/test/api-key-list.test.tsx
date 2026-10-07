import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ApiKeyList, type ApiKeyListProps } from "../src";
import { axeViolations } from "./axe";

const scopes = [
  { id: "read", label: "Read", description: "Read records." },
  { id: "write", label: "Write" },
];
const keys = [
  { id: "k1", name: "Deploy script", prefix: "rk_demo_8f2a", scopes: ["read", "write"], createdAt: "2027-01-03", lastUsedAt: "2027-02-12" },
  { id: "k2", name: "Reporting job", prefix: "rk_demo_c41d", scopes: ["read"], createdAt: "2026-11-09", lastUsedAt: null },
];

function List(props: Partial<ApiKeyListProps>) {
  return <ApiKeyList keys={keys} scopes={scopes} onCreate={async () => ({ secret: "rk_demo_SECRET123" })} onRevoke={() => {}} {...props} />;
}

async function openCreate(u: ReturnType<typeof userEvent.setup>) {
  await u.click(screen.getByRole("button", { name: "Create key" }));
  return screen.findByRole("dialog", { name: "Create API key" });
}

describe("ApiKeyList", () => {
  it("lists the keys with name, prefix, dates and scope badges", () => {
    render(<List />);
    expect(screen.getByRole("heading", { level: 2, name: "API keys" })).toBeInTheDocument();
    const items = within(screen.getByRole("list", { name: "API keys" })).getAllByRole("listitem", { hidden: false }).filter((li) => li.parentElement!.getAttribute("aria-label") === "API keys");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Deploy script");
    expect(items[0]).toHaveTextContent("rk_demo_8f2a…");
    expect(items[0]).toHaveTextContent("Created January 3, 2027 · Last used February 12, 2027");
    expect(items[1]).toHaveTextContent("Never used");
    expect(within(items[0]).getByRole("list", { name: "Scopes of Deploy script" })).toHaveTextContent("ReadWrite");
  });

  it("never shows a secret in the list", () => {
    const { container } = render(<List />);
    expect(container.textContent).not.toContain("SECRET");
  });

  it("falls back to the scope id when it has no label", () => {
    render(<List keys={[{ ...keys[0], scopes: ["admin"] }]} />);
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  describe("create", () => {
    it("opens a dialog with the focus on the name and the scopes as a group of checkboxes", async () => {
      const u = userEvent.setup();
      render(<List />);
      const dialog = await openCreate(u);
      await waitFor(() => expect(within(dialog).getByLabelText(/Name/)).toHaveFocus());
      const group = within(dialog).getByRole("group", { name: "Scopes" });
      expect(within(group).getAllByRole("checkbox")).toHaveLength(2);
      expect(within(group).getByRole("checkbox", { name: "Read" })).toHaveAccessibleDescription("Read records.");
    });

    it("needs a name and at least one scope, and says so in an error summary", async () => {
      const onCreate = vi.fn(async () => ({ secret: "x" }));
      const u = userEvent.setup();
      render(<List onCreate={onCreate} />);
      const dialog = await openCreate(u);
      await u.click(within(dialog).getByRole("button", { name: "Create key" }));
      const summary = await within(dialog).findByRole("region", { name: "There is a problem" });
      expect(summary).toHaveTextContent("Name is required");
      expect(summary).toHaveTextContent("Choose at least one scope.");
      expect(onCreate).not.toHaveBeenCalled();
    });

    it("creates with the trimmed name and the chosen scopes, then shows the secret once with a warning", async () => {
      const onCreate = vi.fn(async () => ({ secret: "rk_demo_SECRET123" }));
      const u = userEvent.setup();
      render(<List onCreate={onCreate} />);
      const dialog = await openCreate(u);
      await u.type(within(dialog).getByLabelText(/Name/), "  CI runner ");
      await u.click(within(dialog).getByRole("checkbox", { name: "Read" }));
      await u.click(within(dialog).getByRole("checkbox", { name: "Write" }));
      await u.click(within(dialog).getByRole("button", { name: "Create key" }));
      await waitFor(() => expect(onCreate).toHaveBeenCalledWith("CI runner", ["read", "write"]));
      const secret = await within(dialog).findByLabelText("Secret key");
      expect(secret).toHaveValue("rk_demo_SECRET123");
      expect(secret).toHaveAttribute("readonly");
      expect(within(dialog).getByRole("alert")).toHaveTextContent("You will not see it again");
      // The copy button gets the focus when the secret appears.
      await waitFor(() => expect(within(dialog).getByRole("button", { name: "Copy key" })).toHaveFocus());
    });

    it("copies the secret and announces it", async () => {
      const u = userEvent.setup();
      render(<List />);
      const dialog = await openCreate(u);
      await u.type(within(dialog).getByLabelText(/Name/), "CI");
      await u.click(within(dialog).getByRole("checkbox", { name: "Read" }));
      await u.click(within(dialog).getByRole("button", { name: "Create key" }));
      await within(dialog).findByLabelText("Secret key");
      const write = vi.spyOn(navigator.clipboard, "writeText");
      await u.click(within(dialog).getByRole("button", { name: "Copy key" }));
      expect(write).toHaveBeenCalledWith("rk_demo_SECRET123");
      await waitFor(() => expect(within(dialog).getByText("Copied")).toBeInTheDocument());
    });

    it("says so when copying is not possible", async () => {
      const u = userEvent.setup();
      render(<List />);
      const dialog = await openCreate(u);
      await u.type(within(dialog).getByLabelText(/Name/), "CI");
      await u.click(within(dialog).getByRole("checkbox", { name: "Read" }));
      await u.click(within(dialog).getByRole("button", { name: "Create key" }));
      await within(dialog).findByLabelText("Secret key");
      vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("no"));
      await u.click(within(dialog).getByRole("button", { name: "Copy key" }));
      expect(await within(dialog).findByText(/Could not copy/)).toBeInTheDocument();
    });

    it("removes the secret when the dialog closes: it is never shown again", async () => {
      const u = userEvent.setup();
      const { container } = render(<List />);
      const dialog = await openCreate(u);
      await u.type(within(dialog).getByLabelText(/Name/), "CI");
      await u.click(within(dialog).getByRole("checkbox", { name: "Read" }));
      await u.click(within(dialog).getByRole("button", { name: "Create key" }));
      await within(dialog).findByLabelText("Secret key");
      await u.click(within(dialog).getByRole("button", { name: "Done" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(document.body.textContent).not.toContain("SECRET123");
      expect(container.textContent).not.toContain("SECRET123");
      // Opening the dialog again starts at the form, not at the old secret.
      const again = await openCreate(u);
      expect(within(again).queryByLabelText("Secret key")).toBeNull();
      expect(within(again).getByLabelText(/Name/)).toBeInTheDocument();
    });

    it("keeps the dialog open with an error when the creation fails", async () => {
      const u = userEvent.setup();
      render(<List onCreate={async () => Promise.reject(new Error("nope"))} />);
      const dialog = await openCreate(u);
      await u.type(within(dialog).getByLabelText(/Name/), "CI");
      await u.click(within(dialog).getByRole("checkbox", { name: "Read" }));
      await u.click(within(dialog).getByRole("button", { name: "Create key" }));
      expect(await within(dialog).findByText("Couldn't create the key. Try again.")).toBeInTheDocument();
      expect(within(dialog).queryByLabelText("Secret key")).toBeNull();
    });

    it("cancels with the Cancel button and with Escape", async () => {
      const onCreate = vi.fn(async () => ({ secret: "x" }));
      const u = userEvent.setup();
      render(<List onCreate={onCreate} />);
      const dialog = await openCreate(u);
      await u.click(within(dialog).getByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await openCreate(u);
      await u.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(screen.getByRole("button", { name: "Create key" })).toHaveFocus();
      expect(onCreate).not.toHaveBeenCalled();
    });
  });

  describe("revoke", () => {
    it("names each button after its key", () => {
      render(<List />);
      expect(screen.getByRole("button", { name: "Revoke Deploy script" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Revoke Reporting job" })).toBeInTheDocument();
    });

    it("needs the key name typed before it revokes", async () => {
      const onRevoke = vi.fn();
      const u = userEvent.setup();
      render(<List onRevoke={onRevoke} />);
      await u.click(screen.getByRole("button", { name: "Revoke Deploy script" }));
      const dialog = await screen.findByRole("alertdialog");
      const confirm = within(dialog).getByRole("button", { name: "Revoke key" });
      expect(confirm).toBeDisabled();
      await u.type(within(dialog).getByLabelText("Type Deploy script to confirm"), "Deploy script");
      await u.click(confirm);
      await waitFor(() => expect(onRevoke).toHaveBeenCalledWith(keys[0]));
      await waitFor(() => expect(screen.getByText("Key Deploy script revoked")).toBeInTheDocument());
    });

    it("moves focus to the heading after a revoke so it is not lost", async () => {
      const u = userEvent.setup();
      render(<List />);
      await u.click(screen.getByRole("button", { name: "Revoke Reporting job" }));
      const dialog = await screen.findByRole("alertdialog");
      await u.type(within(dialog).getByLabelText(/Type/), "Reporting job");
      await u.click(within(dialog).getByRole("button", { name: "Revoke key" }));
      await waitFor(() => expect(screen.getByRole("heading", { name: "API keys" })).toHaveFocus());
    });

    it("does nothing when the confirmation is cancelled", async () => {
      const onRevoke = vi.fn();
      const u = userEvent.setup();
      render(<List onRevoke={onRevoke} />);
      await u.click(screen.getByRole("button", { name: "Revoke Deploy script" }));
      await u.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }));
      expect(onRevoke).not.toHaveBeenCalled();
    });
  });

  describe("states", () => {
    it("shows the empty state when there are no keys", () => {
      render(<List keys={[]} />);
      expect(screen.getByText("No API keys yet")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create key" })).toBeInTheDocument();
    });

    it("shows loading, and an error with a retry", async () => {
      const onRetry = vi.fn();
      const u = userEvent.setup();
      const { container, rerender } = render(<List state="loading" />);
      expect(container.querySelector("[aria-busy=true]")).not.toBeNull();
      expect(screen.queryByRole("list", { name: "API keys" })).toBeNull();
      rerender(<List state="error" onRetry={onRetry} />);
      await u.click(screen.getByRole("button", { name: "Try again" }));
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe("permissions", () => {
    it("keeps Create key reachable with the reason when disabled, and opens nothing", async () => {
      const u = userEvent.setup();
      render(<List permissions={{ create: { state: "disabled", reason: "Only admins can create keys." } }} />);
      const button = screen.getByRole("button", { name: "Create key" });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAccessibleDescription("Only admins can create keys.");
      await u.click(button);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("leaves Create key out when hidden", () => {
      render(<List permissions={{ create: "hidden" }} />);
      expect(screen.queryByRole("button", { name: "Create key" })).toBeNull();
    });

    it("keeps a disabled Revoke reachable with the reason and revokes nothing", async () => {
      const onRevoke = vi.fn();
      const u = userEvent.setup();
      render(<List onRevoke={onRevoke} permissions={{ revoke: { state: "disabled", reason: "Admins only." } }} />);
      const button = screen.getByRole("button", { name: "Revoke Deploy script" });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAccessibleDescription("Admins only.");
      await u.click(button);
      expect(screen.queryByRole("alertdialog")).toBeNull();
      expect(onRevoke).not.toHaveBeenCalled();
    });
  });

  it("puts a class name on every part", async () => {
    const u = userEvent.setup();
    const names = ["root", "header", "title", "createButton", "list", "item", "name", "prefix", "meta", "scopes", "scope", "revokeButton", "status"] as const;
    const classNames = Object.fromEntries([...names, "dialog", "form", "secret", "copyButton", "warning", "reason"].map((n) => [n, `c-${n}`]));
    const { container } = render(<List classNames={classNames} />);
    for (const n of names) expect(container.querySelector(`.c-${n}`), n).not.toBeNull();
    const dialog = await openCreate(u);
    expect(dialog.className).toContain("c-dialog");
    expect(dialog.querySelector(".c-form")).not.toBeNull();
    await u.type(within(dialog).getByLabelText(/Name/), "CI");
    await u.click(within(dialog).getByRole("checkbox", { name: "Read" }));
    await u.click(within(dialog).getByRole("button", { name: "Create key" }));
    await within(dialog).findByLabelText("Secret key");
    for (const n of ["secret", "copyButton", "warning"]) expect(dialog.querySelector(`.c-${n}`), n).not.toBeNull();
    const { container: disabled } = render(<List classNames={{ reason: "c-why" }} permissions={{ create: { state: "disabled", reason: "No" } }} />);
    expect(disabled.querySelector(".c-why")).not.toBeNull();
  });

  it("has no axe violations in each state and with the dialogs open", async () => {
    for (const props of [{}, { keys: [] }, { state: "loading" as const }, { state: "error" as const }, { permissions: { create: { state: "disabled" as const, reason: "No" }, revoke: "disabled" as const } }]) {
      const { container, unmount } = render(<List onRetry={() => {}} {...props} />);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
    const u = userEvent.setup();
    render(<List />);
    const dialog = await openCreate(u);
    expect(await axeViolations(dialog)).toEqual([]);
    await u.type(within(dialog).getByLabelText(/Name/), "CI");
    await u.click(within(dialog).getByRole("checkbox", { name: "Read" }));
    await u.click(within(dialog).getByRole("button", { name: "Create key" }));
    await within(dialog).findByLabelText("Secret key");
    expect(await axeViolations(dialog)).toEqual([]);
  });

  it("renders on the server", () => {
    const html = renderToString(<List />);
    expect(html).toContain("Deploy script");
    expect(html).toContain("rk_demo_8f2a");
  });
});
