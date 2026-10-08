import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FormTextField, SettingsRow, SettingsSection, Switch, useSettingsSection, type SettingsSectionProps } from "../src";
import { axeViolations } from "./axe";

function Section(props: Partial<SettingsSectionProps>) {
  return (
    <SettingsSection title="Profile" description="Your name." defaultValues={{ name: "Lena" }} onSave={() => {}} {...props}>
      <FormTextField name="name" label="Name" />
    </SettingsSection>
  );
}

const status = () => document.querySelector("p[role=status]") as HTMLElement;
const input = () => screen.getByLabelText("Name") as HTMLInputElement;

describe("SettingsSection", () => {
  it("is a region named by its heading, with the description", () => {
    render(<Section headingLevel={3} />);
    expect(screen.getByRole("region", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Profile" })).toBeInTheDocument();
    expect(screen.getByText("Your name.")).toBeInTheDocument();
  });

  it("shows the Save and Cancel bar only after a change and says so politely", async () => {
    const u = userEvent.setup();
    render(<Section />);
    expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
    await u.type(input(), "x");
    expect(await screen.findByRole("button", { name: "Save changes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(status()).toHaveTextContent("Unsaved changes");
    // Back to the saved value: the bar goes away again.
    await u.clear(input());
    await u.type(input(), "Lena");
    await waitFor(() => expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull());
  });

  it("saves the values, announces the success message and moves focus to it", async () => {
    const onSave = vi.fn();
    const u = userEvent.setup();
    render(<Section onSave={onSave} successMessage="Profile saved" saveLabel="Save profile" />);
    await u.type(input(), "ra");
    await u.click(await screen.findByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ name: "Lenara" }));
    const saved = await screen.findByText("Profile saved");
    expect(status()).toBe(saved.closest("[role=status]"));
    await waitFor(() => expect(status()).toHaveFocus());
    expect(screen.queryByRole("button", { name: "Save profile" })).toBeNull();
  });

  it("saves from the keyboard with Enter in a field", async () => {
    const onSave = vi.fn();
    const u = userEvent.setup();
    render(<Section onSave={onSave} />);
    await u.type(input(), "!{Enter}");
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ name: "Lena!" }));
  });

  it("puts the saved values back on Cancel, calls onCancel and focuses the first field", async () => {
    const onCancel = vi.fn();
    const u = userEvent.setup();
    render(<Section onCancel={onCancel} />);
    await u.type(input(), "zzz");
    await u.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(input().value).toBe("Lena");
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(input()).toHaveFocus();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull());
  });

  it("cancels back to the last saved values, not the first ones", async () => {
    const u = userEvent.setup();
    render(<Section />);
    await u.type(input(), "a");
    await u.click(await screen.findByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.getByText("Changes saved")).toBeInTheDocument());
    await u.type(input(), "b");
    await u.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(input().value).toBe("Lena" + "a");
  });

  it("keeps the changes and moves focus to the error summary when the save fails", async () => {
    const u = userEvent.setup();
    render(<Section onSave={() => ({ fieldErrors: { name: "That name is taken." } })} />);
    await u.type(input(), "x");
    await u.click(await screen.findByRole("button", { name: "Save changes" }));
    const summary = await screen.findByRole("region", { name: "There is a problem" });
    expect(summary).toHaveTextContent("That name is taken.");
    await waitFor(() => expect(summary).toHaveFocus());
    expect(input().value).toBe("Lenax");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("shows a form-level error", async () => {
    const u = userEvent.setup();
    render(<Section onSave={() => ({ formError: "The server is unavailable." })} />);
    await u.type(input(), "x");
    await u.click(await screen.findByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("The server is unavailable.")).toBeInTheDocument();
  });

  it("has no footer and no form without onSave", () => {
    const { container } = render(
      <SettingsSection title="Notifications">
        <p>Content</p>
      </SettingsSection>,
    );
    expect(container.querySelector("form")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("lays out stacked by default and split on request, and marks a danger tone", () => {
    const { container, rerender } = render(<Section />);
    expect(container.querySelector("section")!.className).not.toContain("md:grid-cols");
    rerender(<Section orientation="split" tone="danger" />);
    expect(container.querySelector("section")!.className).toContain("md:grid-cols");
    expect(screen.getByRole("heading", { name: "Profile" }).className).toContain("feedback-danger");
  });

  describe("permissions", () => {
    it("makes the content read-only and shows the reason, linked to the content", () => {
      render(<Section permissions={{ edit: { state: "disabled", reason: "Only owners can edit." } }} />);
      expect(input()).toBeDisabled();
      const reason = screen.getByText("Only owners can edit.");
      expect(document.querySelector(`fieldset[aria-describedby="${reason.id}"]`)).not.toBeNull();
    });

    it("renders nothing when hidden", () => {
      const { container } = render(<Section permissions={{ edit: "hidden" }} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("lets a custom control read the read-only state", () => {
      function Probe() {
        const { isReadOnly, reason } = useSettingsSection();
        return <p>{isReadOnly ? `read-only: ${reason}` : "editable"}</p>;
      }
      render(
        <SettingsSection title="T" permissions={{ edit: { state: "disabled", reason: "No." } }}>
          <Probe />
        </SettingsSection>,
      );
      expect(screen.getByText("read-only: No.")).toBeInTheDocument();
    });
  });

  it("puts a class name on every part", async () => {
    const u = userEvent.setup();
    const names = ["root", "header", "title", "description", "card", "content", "footer", "saveButton", "cancelButton", "status"] as const;
    const classNames = Object.fromEntries(names.map((n) => [n, `c-${n}`]));
    const { container } = render(<Section classNames={classNames} />);
    await u.type(input(), "x");
    await screen.findByRole("button", { name: "Save changes" });
    for (const n of names) expect(container.querySelector(`.c-${n}`), n).not.toBeNull();
    const { container: ro } = render(
      <Section classNames={{ reason: "c-reason" }} permissions={{ edit: { state: "disabled", reason: "Why not" } }} />,
    );
    expect(ro.querySelector(".c-reason")).not.toBeNull();
  });

  it("has no axe violations, ready, dirty and read-only", async () => {
    const u = userEvent.setup();
    const { container, rerender } = render(<Section />);
    expect(await axeViolations(container)).toEqual([]);
    await u.type(input(), "x");
    await screen.findByRole("button", { name: "Save changes" });
    expect(await axeViolations(container)).toEqual([]);
    rerender(<Section permissions={{ edit: { state: "disabled", reason: "Only owners can edit." } }} />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders on the server", () => {
    const html = renderToString(<Section />);
    expect(html).toContain("Profile");
    expect(html).toContain("Name");
  });
});

describe("SettingsRow", () => {
  it("is a group named by its label, and hands the ids to the control", async () => {
    const u = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SettingsRow label="Weekly summary" description="Every Monday.">
        {({ descriptionId }) => (
          <Switch aria-describedby={descriptionId} onChange={onChange}>
            <span className="sr-only">Weekly summary</span>
          </Switch>
        )}
      </SettingsRow>,
    );
    const group = screen.getByRole("group", { name: "Weekly summary" });
    const toggle = screen.getByRole("switch", { name: "Weekly summary" });
    expect(group).toContainElement(toggle);
    expect(toggle).toHaveAccessibleDescription("Every Monday.");
    toggle.focus();
    await u.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("takes plain children and class names", () => {
    const { container } = render(
      <SettingsRow label="L" description="D" classNames={{ root: "r", text: "t", label: "l", description: "d", control: "c" }}>
        <button type="button">Edit</button>
      </SettingsRow>,
    );
    for (const c of ["r", "t", "l", "d", "c"]) expect(container.querySelector(`.${c}`), c).not.toBeNull();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });
});
