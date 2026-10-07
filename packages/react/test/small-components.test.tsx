import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AvatarGroup, Collapsible, Separator, ToggleButton, ToggleButtonGroup, avatarGroupName } from "../src";
import { axeViolations } from "./axe";

describe("Collapsible", () => {
  it("is closed by default and opens with a click", async () => {
    const user = userEvent.setup();
    render(<Collapsible title="Details">Hidden text</Collapsible>);
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Hidden text")).toBeVisible();
  });

  it("opens and closes with Enter and Space", async () => {
    const user = userEvent.setup();
    render(<Collapsible title="Details">Body</Collapsible>);
    await user.tab();
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("can start open", () => {
    render(
      <Collapsible title="Details" defaultExpanded>
        Body
      </Collapsible>,
    );
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute("aria-expanded", "true");
  });

  it("is controlled by isExpanded and reports changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Collapsible title="Details" isExpanded={false} onExpandedChange={onChange}>
        Body
      </Collapsible>,
    );
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute("aria-expanded", "false");
  });

  it("does nothing when disabled", async () => {
    const user = userEvent.setup();
    render(
      <Collapsible title="Details" isDisabled>
        Body
      </Collapsible>,
    );
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the summary line while closed", () => {
    render(
      <Collapsible title="Files" summary="3 files">
        Body
      </Collapsible>,
    );
    expect(screen.getByText("3 files")).toBeVisible();
  });

  it("turns off its animation for reduced motion", () => {
    const { container } = render(
      <Collapsible title="Details" defaultExpanded>
        Body
      </Collapsible>,
    );
    expect(container.innerHTML).toContain("motion-reduce:transition-none");
  });

  it("renders on the server", () => {
    expect(renderToString(<Collapsible title="Details">Body</Collapsible>)).toContain("Details");
  });

  it("has no axe violations open or closed", async () => {
    const { container } = render(
      <>
        <Collapsible title="One" summary="Summary">
          Body
        </Collapsible>
        <Collapsible title="Two" defaultExpanded>
          Body
        </Collapsible>
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Separator", () => {
  it("is a semantic separator by default", () => {
    render(<Separator />);
    expect(screen.getByRole("separator")).not.toHaveAttribute("aria-orientation");
  });

  it("states its orientation when vertical", () => {
    render(<Separator orientation="vertical" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("is hidden from assistive technology when decorative", () => {
    const { container } = render(<Separator decorative />);
    expect(screen.queryByRole("separator")).toBeNull();
    expect(container.firstElementChild).toHaveAttribute("role", "none");
  });

  it("shows its label as text", () => {
    render(<Separator label="or" />);
    expect(screen.getByRole("separator")).toHaveTextContent("or");
  });

  it("renders on the server", () => {
    expect(renderToString(<Separator label="or" />)).toContain("or");
  });

  it("has no axe violations in any form", async () => {
    const { container } = render(
      <div>
        <Separator />
        <Separator label="or" />
        <Separator decorative />
        <div style={{ height: 20, display: "flex" }}>
          <Separator orientation="vertical" />
        </div>
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("ToggleButton", () => {
  it("stays pressed after a click and reports it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToggleButton onChange={onChange}>Pin</ToggleButton>);
    const button = screen.getByRole("button", { name: "Pin" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("toggles with Space and Enter", async () => {
    const user = userEvent.setup();
    render(<ToggleButton>Pin</ToggleButton>);
    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Pin" })).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Pin" })).toHaveAttribute("aria-pressed", "false");
  });

  it("can be controlled and disabled", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ToggleButton isSelected>Pin</ToggleButton>);
    expect(screen.getByRole("button", { name: "Pin" })).toHaveAttribute("aria-pressed", "true");
    rerender(
      <ToggleButton isDisabled defaultSelected>
        Pin
      </ToggleButton>,
    );
    await user.click(screen.getByRole("button", { name: "Pin" }));
    expect(screen.getByRole("button", { name: "Pin" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Pin" })).toBeDisabled();
  });

  it("takes its height from the shared control sizes", () => {
    render(
      <>
        <ToggleButton size="sm">S</ToggleButton>
        <ToggleButton size="lg">L</ToggleButton>
      </>,
    );
    expect(screen.getByRole("button", { name: "S" }).className).toContain("--rd-size-control-sm");
    expect(screen.getByRole("button", { name: "L" }).className).toContain("--rd-size-control-lg");
  });

  it("has no axe violations, including an icon-only button with a name", async () => {
    const { container } = render(
      <>
        <ToggleButton variant="outline">Mute</ToggleButton>
        <ToggleButton aria-label="Bold">B</ToggleButton>
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("ToggleButtonGroup", () => {
  const group = (props: Record<string, unknown> = {}) => (
    <ToggleButtonGroup label="Style" {...props}>
      <ToggleButton id="a">Bold</ToggleButton>
      <ToggleButton id="b">Italic</ToggleButton>
      <ToggleButton id="c">Underline</ToggleButton>
    </ToggleButtonGroup>
  );

  it("is a named group", () => {
    render(group({ selectionMode: "multiple" }));
    expect(screen.getByRole("toolbar", { name: "Style" })).toBeInTheDocument();
  });

  it("allows several pressed in multiple mode and reports the keys", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(group({ selectionMode: "multiple", onSelectionChange }));
    await user.click(screen.getByRole("button", { name: "Bold" }));
    await user.click(screen.getByRole("button", { name: "Italic" }));
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "true");
    expect([...onSelectionChange.mock.lastCall![0]]).toEqual(["a", "b"]);
  });

  it("keeps one pressed in single mode", async () => {
    const user = userEvent.setup();
    render(group({ defaultSelectedKeys: ["a"] }));
    await user.click(screen.getByRole("radio", { name: "Italic" }));
    expect(screen.getByRole("radio", { name: "Italic" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Bold" })).not.toBeChecked();
  });

  it("is controlled by selectedKeys", async () => {
    const user = userEvent.setup();
    render(group({ selectionMode: "multiple", selectedKeys: ["c"] }));
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(screen.getByRole("button", { name: "Underline" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "false");
  });

  it("moves focus between buttons with the arrow keys", async () => {
    const user = userEvent.setup();
    render(group({ selectionMode: "multiple" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
  });

  it("shares its size and look with its buttons", () => {
    render(group({ size: "sm", variant: "outline", selectionMode: "multiple" }));
    const cls = screen.getByRole("button", { name: "Bold" }).className;
    expect(cls).toContain("--rd-size-control-sm");
    expect(cls).toContain("[box-shadow:var(--rd-elevation-raised)]");
  });

  it("renders on the server", () => {
    expect(renderToString(group({ selectionMode: "multiple" }))).toContain("Bold");
  });

  it("has no axe violations, single or multiple", async () => {
    const { container } = render(
      <>
        {group({ selectionMode: "multiple", defaultSelectedKeys: ["a"] })}
        {group({ defaultSelectedKeys: ["b"] })}
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("AvatarGroup", () => {
  const people = [{ name: "Ada Lovelace" }, { name: "Grace Hopper" }, { name: "Katherine Johnson" }, { name: "Hedy Lamarr" }, { name: "Margaret Hamilton" }];

  it("is one named image listing the people and the rest", () => {
    render(<AvatarGroup label="Team members" max={2} avatars={people} />);
    expect(screen.getByRole("img", { name: "Team members: Ada Lovelace, Grace Hopper and 3 more" })).toBeInTheDocument();
  });

  it("shows +N for the overflow and hides the avatars inside from assistive technology", () => {
    render(<AvatarGroup max={2} avatars={people} />);
    expect(screen.getByText("+3")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("has no chip when everyone fits", () => {
    render(<AvatarGroup avatars={people.slice(0, 2)} />);
    expect(screen.queryByText(/^\+/)).toBeNull();
    expect(screen.getByRole("img")).toHaveAccessibleName("Members: Ada Lovelace and Grace Hopper");
  });

  it("names a group with one person and with none", () => {
    expect(avatarGroupName("Owners", ["Ada Lovelace"], 1)).toBe("Owners: Ada Lovelace");
    expect(avatarGroupName("Owners", [], 0)).toBe("Owners");
  });

  it("uses the size for the avatars and the chip", () => {
    const { container } = render(<AvatarGroup size="lg" max={1} avatars={people} />);
    expect(container.innerHTML).toContain("size-14");
  });

  it("renders on the server", () => {
    expect(renderToString(<AvatarGroup avatars={people} max={2} />)).toContain("+3");
  });

  it("has no axe violations", async () => {
    const { container } = render(<AvatarGroup label="Team members" max={2} avatars={people} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
