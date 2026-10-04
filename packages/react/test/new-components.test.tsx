import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Accordion,
  AccordionItem,
  Button,
  DialogTrigger,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  Sheet,
  Slider,
} from "../src";
import { axeViolations } from "./axe";

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

describe("Menu", () => {
  function Actions({ onAction = () => {} }: { onAction?: (key: unknown) => void }) {
    return (
      <MenuTrigger>
        <Button variant="secondary">Actions</Button>
        <Menu onAction={onAction}>
          <MenuSection title="Edit">
            <MenuItem id="edit" shortcut="⌘E">
              Edit
            </MenuItem>
            <MenuItem id="duplicate">Duplicate</MenuItem>
          </MenuSection>
          <MenuItem id="delete" variant="danger">
            Delete project
          </MenuItem>
        </Menu>
      </MenuTrigger>
    );
  }

  it("opens from the keyboard, focuses the first item, and returns focus on choose", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Actions onAction={onAction} />);
    const button = screen.getByRole("button", { name: "Actions" });
    expect(button).toHaveAttribute("aria-haspopup", "true");
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.tab();
    await user.keyboard("{Enter}");
    const menu = screen.getByRole("menu");
    expect(menu).toHaveAccessibleName("Actions"); // labelled by its button
    expect(screen.getByRole("menuitem", { name: /^Edit/ })).toHaveFocus();
    expect(screen.getByRole("group", { name: "Edit" })).toBeInTheDocument(); // the section

    await user.keyboard("{ArrowDown}{Enter}");
    expect(onAction.mock.calls[0][0]).toBe("duplicate"); // React Aria also passes a second argument
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await nextFrame();
    expect(button).toHaveFocus();
  });

  it("wraps with the arrow keys, jumps by letter, and closes with Esc", async () => {
    const user = userEvent.setup();
    render(<Actions />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Delete project" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: /^Edit/ })).toHaveFocus();
    await user.keyboard("d");
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("exposes checked state in a selectable menu", async () => {
    const user = userEvent.setup();
    render(
      <MenuTrigger>
        <Button>Columns</Button>
        <Menu selectionMode="multiple" defaultSelectedKeys={["name"]}>
          <MenuItem id="name">Name</MenuItem>
          <MenuItem id="owner">Owner</MenuItem>
        </Menu>
      </MenuTrigger>,
    );
    await user.click(screen.getByRole("button", { name: "Columns" }));
    expect(screen.getByRole("menuitemcheckbox", { name: "Name" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Owner" }));
    expect(screen.getByRole("menuitemcheckbox", { name: "Owner" })).toHaveAttribute("aria-checked", "true");
  });

  it("has no axe violations when open", async () => {
    const user = userEvent.setup();
    render(<Actions />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(await axeViolations()).toEqual([]);
  });
});

describe("Sheet", () => {
  function Filters() {
    return (
      <DialogTrigger>
        <Button>Filters</Button>
        <Sheet title="Filters" description="Narrow down the list.">
          <Button>Apply</Button>
        </Sheet>
      </DialogTrigger>
    );
  }

  it("opens as a dialog named by its title, and closes with the Close button", async () => {
    const user = userEvent.setup();
    render(<Filters />);
    const trigger = screen.getByRole("button", { name: "Filters" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Filters" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement); // focus moved in
    expect(within(dialog).getByText("Narrow down the list.")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await nextFrame();
    expect(trigger).toHaveFocus();
  });

  it("keeps focus inside and closes with Esc", async () => {
    const user = userEvent.setup();
    render(<Filters />);
    await user.click(screen.getByRole("button", { name: "Filters" }));
    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 4; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no axe violations when open, on every side", async () => {
    const user = userEvent.setup();
    for (const side of ["end", "start", "bottom"] as const) {
      const { unmount } = render(
        <DialogTrigger>
          <Button>Open {side}</Button>
          <Sheet title={`Sheet ${side}`} side={side}>
            Body
          </Sheet>
        </DialogTrigger>,
      );
      await user.click(screen.getByRole("button", { name: `Open ${side}` }));
      expect(await axeViolations()).toEqual([]);
      unmount();
    }
  });
});

describe("Slider", () => {
  it("is a labelled slider that announces the formatted value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Slider label="Budget" defaultValue={250} maxValue={1000} step={50} formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} onChange={onChange} />);
    const slider = screen.getByRole("slider", { name: "Budget" });
    expect(slider).toHaveAttribute("aria-valuetext", "$250");
    expect(screen.getByText("$250")).toBeInTheDocument(); // the visible output

    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(slider).toHaveAttribute("aria-valuetext", "$300");
    expect(onChange).toHaveBeenLastCalledWith(300);
    await user.keyboard("{End}");
    expect(slider).toHaveAttribute("aria-valuetext", "$1,000");
  });

  it("makes a range with two named thumbs that can't cross", async () => {
    const user = userEvent.setup();
    render(<Slider label="Age" defaultValue={[20, 25]} minValue={18} maxValue={99} />);
    const min = screen.getByRole("slider", { name: /Minimum/ });
    const max = screen.getByRole("slider", { name: /Maximum/ });
    expect(min).toHaveAccessibleName(/Age/);
    expect(screen.getByText("20 – 25")).toBeInTheDocument();

    await user.tab();
    await user.keyboard("{ArrowRight>10/}"); // try to push past the other thumb
    expect(Number(min.getAttribute("aria-valuenow"))).toBeLessThanOrEqual(Number(max.getAttribute("aria-valuenow")));
  });

  it("is disabled when isDisabled", () => {
    render(<Slider label="Brightness" defaultValue={70} isDisabled />);
    expect(screen.getByRole("slider", { name: "Brightness" })).toBeDisabled();
  });

  it("has no axe violations", async () => {
    render(
      <>
        <Slider label="Volume" defaultValue={40} />
        <Slider label="Price" defaultValue={[10, 90]} />
      </>,
    );
    expect(await axeViolations()).toEqual([]);
  });
});

describe("Accordion", () => {
  function Faq(props: { allowsMultipleExpanded?: boolean }) {
    return (
      <Accordion {...props} defaultExpandedKeys={["a"]}>
        <AccordionItem id="a" title="First question">
          First answer
        </AccordionItem>
        <AccordionItem id="b" title="Second question">
          Second answer
        </AccordionItem>
        <AccordionItem id="c" title="Locked question" isDisabled>
          Locked answer
        </AccordionItem>
      </Accordion>
    );
  }

  it("uses real headings with buttons that expose and toggle their state", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    const first = screen.getByRole("button", { name: "First question" });
    const second = screen.getByRole("button", { name: "Second question" });
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(second).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("First answer")).toBeVisible();

    second.focus();
    await user.keyboard("{Enter}");
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(first).toHaveAttribute("aria-expanded", "false"); // one at a time by default
    expect(screen.getByRole("group", { name: "Second question" })).toHaveTextContent("Second answer"); // the panel, labelled by its button
  });

  it("keeps several open with allowsMultipleExpanded", async () => {
    const user = userEvent.setup();
    render(<Faq allowsMultipleExpanded />);
    await user.click(screen.getByRole("button", { name: "Second question" }));
    expect(screen.getByRole("button", { name: "First question" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Second question" })).toHaveAttribute("aria-expanded", "true");
  });

  it("disables single items", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const locked = screen.getByRole("button", { name: "Locked question" });
    expect(locked).toBeDisabled();
    await user.click(locked);
    expect(locked).toHaveAttribute("aria-expanded", "false");
  });

  it("has no axe violations", async () => {
    render(<Faq />);
    expect(await axeViolations()).toEqual([]);
  });
});
