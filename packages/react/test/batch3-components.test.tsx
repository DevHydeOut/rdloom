import { Time } from "@internationalized/date";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  CommandGroup,
  CommandItem,
  CommandPalette,
  EmptyState,
  FileUpload,
  Kbd,
  Step,
  Steps,
  TagInput,
  TimeField,
  Tree,
  TreeItem,
  formatBytes,
  matchesAccept,
} from "../src";
import { axeViolations } from "./axe";

describe("Kbd", () => {
  it("is a kbd element", () => {
    const { container } = render(<Kbd>Esc</Kbd>);
    expect(container.querySelector("kbd")).toHaveTextContent("Esc");
  });

  it("renders on the server with no client code", () => {
    expect(renderToString(<Kbd size="sm">K</Kbd>)).toContain("<kbd");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <p>
        Press <Kbd>Ctrl</Kbd>+<Kbd size="sm">K</Kbd>
      </p>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("EmptyState", () => {
  it("has a heading, a description and actions in order", () => {
    render(
      <EmptyState title="No projects yet" description="Create one." icon={<svg data-testid="icon" />}>
        <button>Create</button>
      </EmptyState>,
    );
    expect(screen.getByRole("heading", { name: "No projects yet", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("Create one.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("hides the icon from assistive technology", () => {
    render(<EmptyState title="Empty" icon={<svg data-testid="icon" />} />);
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the heading level between 2 and 6", () => {
    const { rerender } = render(<EmptyState title="T" headingLevel={1} />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    rerender(<EmptyState title="T" headingLevel={4} />);
    expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument();
  });

  it("is not an alert: it is page content", () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders on the server with no client code", () => {
    expect(renderToString(<EmptyState title="Empty" description="d" />)).toContain("Empty");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <EmptyState title="No results" description="Try again" icon={<svg />} size="sm">
        <button>Clear</button>
      </EmptyState>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Steps", () => {
  const steps = (current: number, orientation?: "horizontal" | "vertical") => (
    <Steps label="Checkout" currentStep={current} orientation={orientation}>
      <Step title="Cart" />
      <Step title="Payment" description="Card details" />
      <Step title="Review" />
    </Steps>
  );

  it("is a named ordered list with one item per step", () => {
    render(steps(2));
    const list = screen.getByRole("list", { name: "Checkout" });
    expect(list.tagName).toBe("OL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  });

  it("marks only the current step, and says each state in words", () => {
    render(steps(2));
    const items = screen.getAllByRole("listitem");
    expect(items[0]).not.toHaveAttribute("aria-current");
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[2]).not.toHaveAttribute("aria-current");
    expect(items[0]).toHaveTextContent("Step 1 of 3, Completed: Cart");
    expect(items[1]).toHaveTextContent("Step 2 of 3, Current step: Payment");
    expect(items[2]).toHaveTextContent("Step 3 of 3, Not started: Review");
  });

  it("shows a check for done steps and the number for the rest, hidden from screen readers", () => {
    const { container } = render(steps(3));
    const markers = [...container.querySelectorAll('li > span[aria-hidden="true"]')].filter((el) => el.className.includes("size-7"));
    expect(markers[0].querySelector("svg")).not.toBeNull();
    expect(markers[1].querySelector("svg")).not.toBeNull();
    expect(markers[2]).toHaveTextContent("3");
  });

  it("moves with currentStep", () => {
    const { rerender } = render(steps(1));
    expect(screen.getAllByRole("listitem")[0]).toHaveAttribute("aria-current", "step");
    rerender(steps(3));
    expect(screen.getAllByRole("listitem")[2]).toHaveAttribute("aria-current", "step");
  });

  it("shows the description", () => {
    render(steps(2));
    expect(screen.getByText("Card details")).toBeInTheDocument();
  });

  it("needs to be inside Steps", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Step title="Lonely" />)).toThrow("inside Steps");
    error.mockRestore();
  });

  it("has no axe violations in either direction", async () => {
    const { container } = render(
      <>
        {steps(2)}
        {steps(1, "vertical")}
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Tree", () => {
  function Files(props: Partial<React.ComponentProps<typeof Tree>> & { onAction?: (k: unknown) => void } = {}) {
    return (
      <Tree label="Files" {...props}>
        <TreeItem id="src" title="src">
          <TreeItem id="button" title="button.tsx" />
          <TreeItem id="menu" title="menu.tsx" />
        </TreeItem>
        <TreeItem id="readme" title="README.md" />
      </Tree>
    );
  }

  it("is a named tree with its items, children hidden until expanded", () => {
    render(<Files />);
    expect(screen.getByRole("treegrid", { name: "Files" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: "src" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("button.tsx")).toBeNull();
    expect(screen.getByRole("row", { name: "README.md" })).not.toHaveAttribute("aria-expanded");
  });

  it("opens and closes with the arrow keys, and children report their level", async () => {
    const user = userEvent.setup();
    render(<Files />);
    await user.tab();
    expect(screen.getByRole("row", { name: "src" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("row", { name: "src" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("row", { name: "button.tsx" })).toHaveAttribute("aria-level", "2");
    expect(screen.getByRole("row", { name: "src" })).toHaveAttribute("aria-level", "1");
    await user.keyboard("{ArrowLeft}");
    await waitFor(() => expect(screen.getByRole("row", { name: "src" })).toHaveAttribute("aria-expanded", "false"));
  });

  it("moves through visible items with Up and Down", async () => {
    const user = userEvent.setup();
    render(<Files defaultExpandedKeys={["src"]} />);
    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("row", { name: "button.tsx" })).toHaveFocus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("row", { name: "README.md" })).toHaveFocus();
  });

  it("selects with Space when selection is on, and reports it", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Files selectionMode="multiple" onSelectionChange={onSelectionChange} />);
    await user.tab();
    await user.keyboard("{ArrowDown}");
    await user.keyboard(" ");
    expect(onSelectionChange).toHaveBeenCalled();
    expect(screen.getByRole("row", { name: "README.md" })).toHaveAttribute("aria-selected", "true");
  });

  it("reports expansion changes", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(<Files onExpandedChange={onExpandedChange} />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect([...(onExpandedChange.mock.calls.at(-1)![0] as Set<string>)]).toEqual(["src"]);
  });

  it("activates an item with Enter", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Files onAction={onAction} />);
    await user.tab();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onAction).toHaveBeenCalledWith("readme");
  });

  it("has only one stop in the tab order, however many items", () => {
    const { container } = render(<Files defaultExpandedKeys={["src"]} />);
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  it("has no axe violations", async () => {
    const { container } = render(<Files defaultExpandedKeys={["src"]} selectionMode="single" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("TimeField", () => {
  it("is a labelled group of named segments", () => {
    render(<TimeField label="Start" defaultValue={new Time(9, 30)} hourCycle={24} />);
    const group = screen.getByRole("group", { name: "Start" });
    expect(within(group).getAllByRole("spinbutton").map((s) => s.getAttribute("aria-label"))).toEqual(["hour,", "minute,"].map((l) => expect.stringContaining(l.slice(0, -1))));
    expect(screen.getByRole("spinbutton", { name: /hour/ })).toHaveAttribute("aria-valuenow", "9");
    expect(screen.getByRole("spinbutton", { name: /minute/ })).toHaveAttribute("aria-valuenow", "30");
  });

  it("adds seconds on request", () => {
    render(<TimeField label="Stamp" granularity="second" hourCycle={24} defaultValue={new Time(14, 5, 30)} />);
    expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
    expect(screen.getByRole("spinbutton", { name: /second/ })).toHaveAttribute("aria-valuenow", "30");
  });

  it("steps a segment with the arrow keys and reports the time", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeField label="Start" hourCycle={24} defaultValue={new Time(9, 30)} onChange={onChange} />);
    screen.getByRole("spinbutton", { name: /hour/ }).focus();
    await user.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ hour: 10, minute: 30 }));
    screen.getByRole("spinbutton", { name: /minute/ }).focus();
    await user.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ hour: 10, minute: 29 }));
  });

  it("types digits and moves on by itself", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeField label="Start" hourCycle={24} defaultValue={new Time(9, 30)} onChange={onChange} />);
    screen.getByRole("spinbutton", { name: /hour/ }).focus();
    await user.keyboard("1745");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ hour: 17, minute: 45 }));
  });

  it("flags a time outside its limits, with the message", async () => {
    render(
      <TimeField
        label="Pickup"
        defaultValue={new Time(20, 15)}
        minValue={new Time(9)}
        maxValue={new Time(17)}
        validationBehavior="aria"
        errorMessage="Pick a time between 9:00 and 17:00."
        hourCycle={24}
      />,
    );
    expect(await screen.findByText("Pick a time between 9:00 and 17:00.")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Pickup" })).toHaveAttribute("data-invalid");
  });

  it("links the description and marks a required field", () => {
    render(<TimeField label="Start" description="Local time" isRequired />);
    expect(screen.getByRole("group", { name: /Start/ })).toHaveAccessibleDescription("Local time");
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("can be disabled", () => {
    render(<TimeField label="Start" isDisabled defaultValue={new Time(9)} />);
    screen.getAllByRole("spinbutton").forEach((s) => expect(s).toHaveAttribute("aria-disabled", "true"));
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <TimeField label="One" defaultValue={new Time(9, 30)} description="Help" />
        <TimeField label="Two" isInvalid errorMessage="Bad" />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("TagInput", () => {
  const tagsOf = () => within(screen.getByRole("group", { name: /^Keywords/ })).queryAllByRole("row").map((r) => r.textContent);
  const input = () => screen.getByRole("textbox", { name: "Keywords" });

  it("is a labelled input with its tags as removable items", () => {
    render(<TagInput label="Keywords" defaultValue={["design", "a11y"]} description="Press Enter" />);
    expect(input()).toHaveAccessibleDescription("Press Enter");
    expect(screen.getByRole("button", { name: "Remove design" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove a11y" })).toBeInTheDocument();
  });

  it("adds a tag on Enter and on comma, and says so", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput label="Keywords" onChange={onChange} />);
    await user.type(input(), "design{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(["design"]);
    await user.type(input(), "ux,");
    expect(onChange).toHaveBeenLastCalledWith(["design", "ux"]);
    expect((input() as HTMLInputElement).value).toBe("");
    expect(screen.getByText("ux added, 2 tags")).toBeInTheDocument();
  });

  it("splits a pasted list", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput label="Keywords" onChange={onChange} />);
    await user.click(input());
    await user.paste("one, two,three\nfour");
    expect(onChange).toHaveBeenLastCalledWith(["one", "two", "three", "four"]);
  });

  it("ignores empty input, and lets an empty Enter through so a form can submit", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput label="Keywords" onChange={onChange} />);
    await user.type(input(), "   ,{Enter}");
    expect(onChange).not.toHaveBeenCalled();
    const notPrevented = fireEvent.keyDown(input(), { key: "Enter" });
    expect(notPrevented).toBe(true);
  });

  it("refuses a duplicate, keeps the text, and says why", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput label="Keywords" defaultValue={["Design"]} onChange={onChange} />);
    await user.type(input(), "design{Enter}");
    expect(onChange).not.toHaveBeenCalled();
    expect((input() as HTMLInputElement).value).toBe("design");
    expect(screen.getByText("design not added: already added")).toBeInTheDocument();
  });

  it("allows duplicates when asked, as separate tags", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput label="Keywords" defaultValue={["x"]} allowDuplicates onChange={onChange} />);
    await user.type(input(), "x{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(["x", "x"]);
    expect(screen.getAllByRole("button", { name: "Remove x" })).toHaveLength(2);
    await user.click(screen.getAllByRole("button", { name: "Remove x" })[0]);
    expect(onChange).toHaveBeenLastCalledWith(["x"]);
  });

  it("stops at the maximum and says so", async () => {
    const user = userEvent.setup();
    render(<TagInput label="Keywords" defaultValue={["a", "b"]} maxTags={2} />);
    expect(input()).toBeDisabled();
    expect(input()).toHaveAttribute("placeholder", "Limit reached");
    await user.click(screen.getByRole("button", { name: "Remove a" }));
    expect(input()).not.toBeDisabled();
  });

  it("refuses a tag over the limit when pasting", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput label="Keywords" maxTags={2} onChange={onChange} />);
    await user.click(input());
    await user.paste("a,b,c");
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"]);
    expect(screen.getByText(/c not added: limit of 2 tags reached/)).toBeInTheDocument();
  });

  it("Backspace in an empty input removes the last tag", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput label="Keywords" defaultValue={["a", "b"]} onChange={onChange} />);
    await user.click(input());
    await user.keyboard("{Backspace}");
    expect(onChange).toHaveBeenLastCalledWith(["a"]);
    expect(screen.getByText("b removed, 1 tag")).toBeInTheDocument();
  });

  it("Backspace with text in the input only edits the text", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput label="Keywords" defaultValue={["a"]} onChange={onChange} />);
    await user.type(input(), "xy{Backspace}");
    expect(onChange).not.toHaveBeenCalled();
    expect((input() as HTMLInputElement).value).toBe("x");
  });

  it("removes with the button and with Delete on a focused tag", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput label="Keywords" defaultValue={["a", "b", "c"]} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Remove a" }));
    expect(onChange).toHaveBeenLastCalledWith(["b", "c"]);
    screen.getAllByRole("row")[0].focus();
    await user.keyboard("{Delete}");
    expect(onChange).toHaveBeenLastCalledWith(["c"]);
  });

  it("keeps text that was typed when focus moves away", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <TagInput label="Keywords" onChange={onChange} />
        <button>elsewhere</button>
      </>,
    );
    await user.type(input(), "late");
    await user.click(screen.getByRole("button", { name: "elsewhere" }));
    expect(onChange).toHaveBeenLastCalledWith(["late"]);
  });

  it("follows value when controlled", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [tags, setTags] = useState<string[]>(["one"]);
      return <TagInput label="Keywords" value={tags} onChange={setTags} />;
    }
    render(<Controlled />);
    await user.type(input(), "two{Enter}");
    expect(screen.getByRole("button", { name: "Remove two" })).toBeInTheDocument();
  });

  it("shows an error and marks the input invalid", () => {
    render(<TagInput label="Keywords" isInvalid errorMessage="Add one" />);
    expect(input()).toBeInvalid();
    expect(input()).toHaveAccessibleDescription("Add one");
  });

  it("can be disabled", () => {
    render(<TagInput label="Keywords" defaultValue={["a"]} isDisabled />);
    expect(input()).toBeDisabled();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <TagInput label="One" defaultValue={["a", "b"]} description="Help" />
        <TagInput label="Two" isInvalid errorMessage="Bad" />
      </>,
    );
    void tagsOf;
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("file helpers", () => {
  it("formats sizes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(900)).toBe("900 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(840 * 1024)).toBe("840 KB");
    expect(formatBytes(1.2 * 1024 * 1024)).toBe("1.2 MB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
    expect(formatBytes(3 * 1024 ** 3)).toBe("3 GB");
  });

  it("matches types, wildcards and extensions, ignoring case", () => {
    const png = { name: "Photo.PNG", type: "image/png" };
    expect(matchesAccept(png)).toBe(true);
    expect(matchesAccept(png, [])).toBe(true);
    expect(matchesAccept(png, ["image/png"])).toBe(true);
    expect(matchesAccept(png, ["image/*"])).toBe(true);
    expect(matchesAccept(png, [".png"])).toBe(true);
    expect(matchesAccept(png, ["application/pdf", ".pdf"])).toBe(false);
    expect(matchesAccept({ name: "a.pdf", type: "" }, [".PDF"])).toBe(true);
  });
});

describe("FileUpload", () => {
  const file = (name: string, size = 100, type = "text/plain") => {
    const f = new File(["x".repeat(size)], name, { type });
    return f;
  };
  const picker = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[type="file"]')!;

  it("is a named group with a drop zone and a browse button", () => {
    render(<FileUpload label="Attachments" description="Up to 5 files." />);
    const group = screen.getByRole("group", { name: "Attachments" });
    expect(group).toHaveAccessibleDescription("Up to 5 files.");
    expect(within(group).getByRole("button", { name: "Browse files" })).toBeInTheDocument();
  });

  it("adds chosen files, lists them, and announces it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<FileUpload label="Attachments" onChange={onChange} />);
    await user.upload(picker(container), [file("a.txt", 1500), file("b.txt", 20)]);
    expect(onChange.mock.calls.at(-1)![0].map((f: File) => f.name)).toEqual(["a.txt", "b.txt"]);
    const list = screen.getByRole("list", { name: /chosen files/ });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(list).toHaveTextContent("1.5 KB");
    expect(screen.getByText("2 files added")).toBeInTheDocument();
  });

  it("removes a file with its own button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<FileUpload label="Attachments" onChange={onChange} />);
    await user.upload(picker(container), [file("a.txt"), file("b.txt")]);
    await user.click(screen.getByRole("button", { name: "Remove a.txt" }));
    expect(onChange.mock.calls.at(-1)![0].map((f: File) => f.name)).toEqual(["b.txt"]);
    expect(screen.getByText("a.txt removed")).toBeInTheDocument();
  });

  it("refuses the wrong type, with the reason in writing", async () => {
    const onReject = vi.fn();
    const { container } = render(<FileUpload label="Photos" accept={["image/png"]} onReject={onReject} />);
    fireEvent.change(picker(container), { target: { files: [file("notes.txt", 10, "text/plain"), file("ok.png", 10, "image/png")] } });
    await waitFor(() => expect(screen.getAllByRole("listitem").some((l) => /ok\.png/.test(l.textContent ?? ""))).toBe(true));
    expect(onReject).toHaveBeenCalledWith([expect.objectContaining({ reason: "type" })]);
    expect(screen.getByText("notes.txt not added: file type not allowed", { selector: "li" })).toBeInTheDocument();
  });

  it("refuses a file over the size limit", async () => {
    const onReject = vi.fn();
    const { container } = render(<FileUpload label="Files" maxSize={1024} onReject={onReject} />);
    fireEvent.change(picker(container), { target: { files: [file("big.bin", 5000)] } });
    await waitFor(() => expect(onReject).toHaveBeenCalled());
    expect(screen.getByText("big.bin not added: larger than 1 KB", { selector: "li" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /chosen files/ })).toBeNull();
  });

  it("stops at the file limit", async () => {
    const onChange = vi.fn();
    const { container } = render(<FileUpload label="Files" maxFiles={2} onChange={onChange} />);
    fireEvent.change(picker(container), { target: { files: [file("a"), file("b"), file("c")] } });
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls.at(-1)![0]).toHaveLength(2);
    expect(screen.getByText("c not added: too many files (limit 2)", { selector: "li" })).toBeInTheDocument();
  });

  it("with multiple off, a new file replaces the old one", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<FileUpload label="Resume" multiple={false} onChange={onChange} />);
    await user.upload(picker(container), file("one.pdf"));
    await user.upload(picker(container), file("two.pdf"));
    expect(onChange.mock.calls.at(-1)![0].map((f: File) => f.name)).toEqual(["two.pdf"]);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("ignores the same file chosen twice", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<FileUpload label="Files" onChange={onChange} />);
    const a = file("a.txt");
    await user.upload(picker(container), a);
    await user.upload(picker(container), a);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("follows value when controlled", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [files, setFiles] = useState<File[]>([file("start.txt")]);
      return <FileUpload label="Files" value={files} onChange={setFiles} />;
    }
    const { container } = render(<Controlled />);
    expect(screen.getByText("start.txt")).toBeInTheDocument();
    await user.upload(picker(container), file("more.txt"));
    expect(screen.getByText("more.txt")).toBeInTheDocument();
  });

  it("can be disabled", () => {
    render(<FileUpload label="Files" isDisabled defaultValue={[file("a.txt")]} />);
    expect(screen.getByRole("button", { name: "Browse files" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove a.txt" })).toBeDisabled();
  });

  it("takes a translated browse label", () => {
    render(<FileUpload label="Dateien" browseLabel="Dateien wählen" />);
    expect(screen.getByRole("button", { name: "Dateien wählen" })).toBeInTheDocument();
  });

  it("has no axe violations, empty or with files and errors", async () => {
    const { container } = render(
      <>
        <FileUpload label="Empty" description="Help" />
        <FileUpload label="Full" defaultValue={[file("a.txt"), file("b.txt")]} />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("CommandPalette", () => {
  const palette = (props: Partial<React.ComponentProps<typeof CommandPalette>> = {}) => (
    <CommandPalette label="Commands" {...props}>
      <CommandGroup title="Go to">
        <CommandItem id="projects" shortcut="G P">
          Projects
        </CommandItem>
        <CommandItem id="settings">Settings</CommandItem>
      </CommandGroup>
      <CommandGroup title="Actions">
        <CommandItem id="theme" keywords="dark light">
          Switch theme
        </CommandItem>
      </CommandGroup>
    </CommandPalette>
  );

  it("is closed until you ask", () => {
    render(palette());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens and closes with Ctrl+K, and with Cmd+K", async () => {
    const user = userEvent.setup();
    render(palette());
    await user.keyboard("{Control>}k{/Control}");
    expect(await screen.findByRole("dialog", { name: "Commands" })).toBeInTheDocument();
    await user.keyboard("{Control>}k{/Control}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await user.keyboard("{Meta>}k{/Meta}");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("claims Ctrl+K from the browser", () => {
    render(palette());
    expect(fireEvent.keyDown(window, { key: "k", ctrlKey: true })).toBe(false);
  });

  it("can have a different shortcut, or none", async () => {
    const user = userEvent.setup();
    const { rerender } = render(palette({ shortcut: "j" }));
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.keyboard("{Control>}j{/Control}");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    rerender(palette({ shortcut: null }));
    await user.keyboard("{Control>}j{/Control}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("puts focus in the search box and lists every command under its group", async () => {
    render(palette({ defaultOpen: true }));
    const search = await screen.findByRole("searchbox");
    await waitFor(() => expect(search).toHaveFocus());
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["ProjectsGP", "Settings", "Switch theme"]);
    expect(screen.getByText("Go to")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("filters as you type, by name and by keywords", async () => {
    const user = userEvent.setup();
    render(palette({ defaultOpen: true }));
    await screen.findByRole("searchbox");
    await user.keyboard("proj");
    expect(screen.getAllByRole("menuitem")).toHaveLength(1);
    await user.clear(screen.getByRole("searchbox"));
    await user.keyboard("dark");
    expect(screen.getByRole("menuitem", { name: "Switch theme" })).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(1);
  });

  it("says so when nothing matches", async () => {
    const user = userEvent.setup();
    render(palette({ defaultOpen: true, emptyMessage: "Nothing found." }));
    await screen.findByRole("searchbox");
    await user.keyboard("zzzz");
    expect(await screen.findByText("Nothing found.")).toBeInTheDocument();
  });

  it("runs the highlighted command with Enter, then closes", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const itemAction = vi.fn();
    render(
      <CommandPalette label="Commands" defaultOpen onAction={onAction}>
        <CommandItem id="one" onAction={itemAction}>
          One
        </CommandItem>
        <CommandItem id="two">Two</CommandItem>
      </CommandPalette>,
    );
    await screen.findByRole("searchbox");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onAction).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("runs a command's own onAction when clicked", async () => {
    const user = userEvent.setup();
    const itemAction = vi.fn();
    render(
      <CommandPalette label="Commands" defaultOpen>
        <CommandItem id="one" onAction={itemAction}>
          One
        </CommandItem>
      </CommandPalette>,
    );
    await user.click(await screen.findByRole("menuitem", { name: "One" }));
    expect(itemAction).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("Escape closes it and returns focus to where you were", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>page</button>
        {palette()}
      </>,
    );
    screen.getByRole("button", { name: "page" }).focus();
    await user.keyboard("{Control>}k{/Control}");
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(screen.getByRole("button", { name: "page" })).toHaveFocus());
  });

  it("can be controlled", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>open it</button>
          {palette({ isOpen: open, onOpenChange: (o) => (setOpen(o), onOpenChange(o)), shortcut: null })}
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "open it" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("hides the shortcut hints from screen readers, and names the command by its text", async () => {
    render(palette({ defaultOpen: true }));
    const projects = await screen.findByRole("menuitem", { name: "Projects" });
    expect(projects.querySelector('[aria-hidden="true"]')).toHaveTextContent("GP");
  });

  it("has no axe violations when open", async () => {
    render(palette({ defaultOpen: true }));
    await screen.findByRole("dialog");
    await act(async () => {});
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
