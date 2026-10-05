import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  BreadcrumbItem,
  Breadcrumbs,
  NumberField,
  Pagination,
  SegmentedControl,
  SegmentedControlItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  paginationRange,
  type SortDescriptor,
} from "../src";
import { axeViolations } from "./axe";

describe("Breadcrumbs", () => {
  const trail = (
    <Breadcrumbs>
      <BreadcrumbItem href="/">Home</BreadcrumbItem>
      <BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
      <BreadcrumbItem>Website redesign</BreadcrumbItem>
    </Breadcrumbs>
  );

  it("is a named navigation landmark holding a list", () => {
    render(trail);
    const nav = screen.getByRole("navigation", { name: "Breadcrumbs" });
    expect(within(nav).getAllByRole("listitem")).toHaveLength(3);
  });

  it("links the steps above and marks the last as the current page, which can't be followed", () => {
    render(trail);
    expect(screen.getAllByRole("link").filter((l) => l.hasAttribute("href"))).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    const current = screen.getByText("Website redesign");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveAttribute("aria-disabled", "true"); // announced as the current page; nothing to follow
    expect(current).not.toHaveAttribute("href");
  });

  it("hides the separators from assistive technology", () => {
    const { container } = render(trail);
    const separators = container.querySelectorAll("svg");
    expect(separators.length).toBeGreaterThan(0);
    separators.forEach((s) => expect(s).toHaveAttribute("aria-hidden", "true"));
  });

  it("takes a translated label", () => {
    render(
      <Breadcrumbs label="Fil d'Ariane">
        <BreadcrumbItem href="/">Accueil</BreadcrumbItem>
        <BreadcrumbItem>Page</BreadcrumbItem>
      </Breadcrumbs>,
    );
    expect(screen.getByRole("navigation", { name: "Fil d'Ariane" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(trail);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("paginationRange", () => {
  it("shows every page when they fit", () => {
    expect(paginationRange(1, 1)).toEqual([1]);
    expect(paginationRange(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginationRange(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]); // 7 = siblings*2 + 5
    expect(paginationRange(1, 0)).toEqual([]);
  });

  it("collapses the far end when near the start", () => {
    expect(paginationRange(1, 20)).toEqual([1, 2, 3, 4, 5, "end-ellipsis", 20]);
    expect(paginationRange(3, 20)).toEqual([1, 2, 3, 4, 5, "end-ellipsis", 20]);
  });

  it("collapses the near end when near the finish", () => {
    expect(paginationRange(20, 20)).toEqual([1, "start-ellipsis", 16, 17, 18, 19, 20]);
    expect(paginationRange(18, 20)).toEqual([1, "start-ellipsis", 16, 17, 18, 19, 20]);
  });

  it("collapses both sides in the middle", () => {
    expect(paginationRange(10, 20)).toEqual([1, "start-ellipsis", 9, 10, 11, "end-ellipsis", 20]);
  });

  it("keeps the same number of items wherever you are, so the control doesn't jump", () => {
    const sizes = new Set(Array.from({ length: 30 }, (_, i) => paginationRange(i + 1, 30).length));
    expect(sizes).toEqual(new Set([7]));
    const wide = new Set(Array.from({ length: 30 }, (_, i) => paginationRange(i + 1, 30, 2).length));
    expect(wide).toEqual(new Set([9]));
  });

  it("never lists a page twice or leaves one out of order", () => {
    for (const count of [8, 9, 20, 100]) {
      for (let page = 1; page <= count; page++) {
        const numbers = paginationRange(page, count).filter((x): x is number => typeof x === "number");
        expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
        expect(new Set(numbers).size).toBe(numbers.length);
        expect(numbers).toContain(page);
        expect(numbers[0]).toBe(1);
        expect(numbers.at(-1)).toBe(count);
      }
    }
  });

  it("copes with a page outside the range", () => {
    expect(paginationRange(99, 20)).toEqual(paginationRange(20, 20));
    expect(paginationRange(-4, 20)).toEqual(paginationRange(1, 20));
  });
});

describe("Pagination", () => {
  it("is a named navigation landmark of buttons, with the current page marked", () => {
    render(<Pagination pageCount={10} defaultPage={4} />);
    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(nav).getByRole("button", { name: "Page 4" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("button", { name: "Page 3" })).not.toHaveAttribute("aria-current");
  });

  it("gives the current page its own colors, not the idle ones as well", () => {
    // Two background utilities on one element are settled by stylesheet order, not the order written,
    // so the current page once rendered with no fill. It must carry one set or the other.
    render(<Pagination pageCount={5} defaultPage={2} />);
    const current = screen.getByRole("button", { name: "Page 2" }).className;
    const idle = screen.getByRole("button", { name: "Page 3" }).className;
    expect(current).toContain("bg-[var(--rd-color-action-primary)]");
    expect(current).not.toContain("bg-[var(--rd-color-surface-default)]");
    expect(idle).toContain("bg-[var(--rd-color-surface-default)]");
    expect(idle).not.toContain("bg-[var(--rd-color-action-primary)]");
  });

  it("goes to a page and tells you, when uncontrolled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination pageCount={10} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Page 3" }));
    expect(onChange).toHaveBeenCalledWith(3);
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
  });

  it("when controlled, only reports: you decide the page", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination pageCount={10} page={2} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onChange).toHaveBeenCalledWith(3);
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  });

  it("steps with previous and next, and they are unavailable at the ends", async () => {
    const user = userEvent.setup();
    render(<Pagination pageCount={3} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Previous page" }));
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  });

  it("works from the keyboard", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination pageCount={5} onChange={onChange} />);
    screen.getByRole("button", { name: "Page 4" }).focus();
    await user.keyboard("{Enter}");
    screen.getByRole("button", { name: "Page 5" }).focus();
    await user.keyboard(" ");
    expect(onChange.mock.calls).toEqual([[4], [5]]);
  });

  it("doesn't report choosing the page you are already on", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination pageCount={5} defaultPage={2} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Page 2" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("collapses long ranges, with decorative ellipses", () => {
    render(<Pagination pageCount={50} defaultPage={25} />);
    expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 50" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Page 10" })).toBeNull();
    const ellipses = screen.getAllByText("…");
    expect(ellipses).toHaveLength(2);
    ellipses.forEach((e) => expect(e).toHaveAttribute("aria-hidden", "true"));
  });

  it("keeps a page inside the range", () => {
    render(<Pagination pageCount={5} page={99} />);
    expect(screen.getByRole("button", { name: "Page 5" })).toHaveAttribute("aria-current", "page");
  });

  it("can be disabled and relabelled", () => {
    render(<Pagination pageCount={3} isDisabled label="Seitennavigation" />);
    const nav = screen.getByRole("navigation", { name: "Seitennavigation" });
    within(nav)
      .getAllByRole("button")
      .forEach((b) => expect(b).toBeDisabled());
  });

  it("has no axe violations", async () => {
    const { container } = render(<Pagination pageCount={20} defaultPage={10} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("SegmentedControl", () => {
  const control = (props: Partial<React.ComponentProps<typeof SegmentedControl>> = {}) => (
    <SegmentedControl label="View" defaultSelectedKey="list" {...props}>
      <SegmentedControlItem id="list">List</SegmentedControlItem>
      <SegmentedControlItem id="board">Board</SegmentedControlItem>
      <SegmentedControlItem id="calendar">Calendar</SegmentedControlItem>
    </SegmentedControl>
  );

  it("is a radio group named by its label, with the chosen option checked", () => {
    render(control());
    const group = screen.getByRole("radiogroup", { name: "View" });
    expect(within(group).getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "List" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Board" })).not.toBeChecked();
  });

  it("chooses by click and reports it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(control({ onChange }));
    await user.click(screen.getByRole("radio", { name: "Board" }));
    expect(onChange).toHaveBeenCalledWith("board");
    expect(screen.getByRole("radio", { name: "Board" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "List" })).not.toBeChecked();
  });

  it("always keeps one option chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(control({ onChange }));
    await user.click(screen.getByRole("radio", { name: "List" }));
    expect(screen.getByRole("radio", { name: "List" })).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves and chooses with the arrow keys, entering on the chosen option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <button>before</button>
        {control({ onChange })}
      </>,
    );
    await user.tab();
    await user.tab();
    expect(screen.getByRole("radio", { name: "List" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(screen.getByRole("radio", { name: "Board" })).toBeChecked());
    expect(onChange).toHaveBeenLastCalledWith("board");
  });

  it("follows selectedKey when controlled", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [key, setKey] = useState<string>("calendar");
      return control({ selectedKey: key, defaultSelectedKey: undefined, onChange: (k) => setKey(String(k)) });
    }
    render(<Controlled />);
    expect(screen.getByRole("radio", { name: "Calendar" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "List" }));
    expect(screen.getByRole("radio", { name: "List" })).toBeChecked();
  });

  it("can be disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(control({ isDisabled: true, onChange }));
    await user.click(screen.getByRole("radio", { name: "Board" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("passes its size to the items", () => {
    render(control({ size: "sm" }));
    expect(screen.getByRole("radiogroup")).toHaveAttribute("data-size", "sm");
  });

  it("has no axe violations", async () => {
    const { container } = render(control());
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Table", () => {
  const rows = [
    { id: "a", name: "Ada", role: "Mathematician" },
    { id: "b", name: "Grace", role: "Admiral" },
    { id: "c", name: "Linus", role: "Engineer" },
  ];

  function Basic(props: Partial<React.ComponentProps<typeof Table>> & { sortable?: boolean }) {
    const { sortable, ...rest } = props;
    return (
      <Table label="People" {...rest}>
        <TableHeader>
          <TableColumn id="name" isRowHeader allowsSorting={sortable}>
            Name
          </TableColumn>
          <TableColumn id="role" allowsSorting={sortable}>
            Role
          </TableColumn>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} id={r.id}>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  it("is a named table with column headers and a row header per row", () => {
    render(<Basic />);
    const table = screen.getByRole("grid", { name: "People" });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Name", "Role"]);
    expect(within(table).getAllByRole("rowheader").map((h) => h.textContent)).toEqual(["Ada", "Grace", "Linus"]);
    expect(within(table).getAllByRole("row")).toHaveLength(4);
  });

  it("reports a sort and exposes aria-sort", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    function Sorted() {
      const [sort, setSort] = useState<SortDescriptor>({ column: "name", direction: "ascending" });
      return (
        <Basic
          sortable
          sortDescriptor={sort}
          onSortChange={(d) => {
            onSortChange(d);
            setSort(d);
          }}
        />
      );
    }
    render(<Sorted />);
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "ascending");
    await user.click(screen.getByRole("columnheader", { name: /Role/ }));
    expect(onSortChange).toHaveBeenCalledWith({ column: "role", direction: "ascending" });
    expect(screen.getByRole("columnheader", { name: /Role/ })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "none");
  });

  it("sorts from the keyboard", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<Basic sortable onSortChange={onSortChange} />);
    screen.getByRole("columnheader", { name: /Name/ }).focus();
    await user.keyboard("{Enter}");
    expect(onSortChange).toHaveBeenCalledTimes(1);
  });

  it("adds a checkbox column when selection is on, with a select-all in the header", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Basic selectionMode="multiple" onSelectionChange={onSelectionChange} />);
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(4); // select all + 3 rows
    await user.click(boxes[1]);
    expect([...(onSelectionChange.mock.calls.at(-1)![0] as Set<string>)]).toEqual(["a"]);
    expect(screen.getAllByRole("row")[1]).toHaveAttribute("aria-selected", "true");
    await user.click(boxes[0]);
    expect(onSelectionChange.mock.calls.at(-1)![0]).toBe("all");
  });

  it("has no checkboxes without selection", () => {
    render(<Basic />);
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("starts with the rows you ask for selected", () => {
    render(<Basic selectionMode="multiple" defaultSelectedKeys={["b"]} />);
    expect(screen.getAllByRole("row")[2]).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("row")[1]).toHaveAttribute("aria-selected", "false");
  });

  it("passes its density to the cells", () => {
    const { container } = render(<Basic density="compact" />);
    expect(container.firstElementChild).toHaveAttribute("data-density", "compact");
  });

  it("has no axe violations, with sorting and selection on", async () => {
    const { container } = render(<Basic sortable selectionMode="multiple" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("NumberField", () => {
  it("is a labelled spin button with its value", () => {
    render(<NumberField label="Quantity" defaultValue={3} minValue={1} maxValue={10} />);
    const input = screen.getByRole("textbox", { name: "Quantity" }) as HTMLInputElement;
    expect(input.value).toBe("3");
    expect(input).toHaveAttribute("inputmode", "numeric");
  });

  it("steps with the arrow keys and the buttons, and reports numbers", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Quantity" defaultValue={4} step={2} onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "Quantity" }) as HTMLInputElement;
    input.focus();
    await user.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenLastCalledWith(6);
    await user.click(screen.getAllByRole("button")[1]); // increase
    expect(onChange).toHaveBeenLastCalledWith(8);
    await user.click(screen.getAllByRole("button")[0]); // decrease
    expect(onChange).toHaveBeenLastCalledWith(6);
  });

  it("snaps to multiples of the step, counted from the minimum", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Quantity" defaultValue={3} step={2} minValue={1} onChange={onChange} />);
    screen.getByRole("textbox", { name: "Quantity" }).focus();
    await user.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenLastCalledWith(5); // 1, 3, 5: counted from minValue
  });

  it("keeps the buttons out of the tab order, so the keyboard stays quick", async () => {
    const user = userEvent.setup();
    render(
      <>
        <NumberField label="Quantity" defaultValue={1} />
        <button>next</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "next" })).toHaveFocus();
  });

  it("holds the value inside its limits", async () => {
    const user = userEvent.setup();
    render(<NumberField label="Quantity" defaultValue={9} minValue={1} maxValue={10} />);
    const input = screen.getByRole("textbox", { name: "Quantity" }) as HTMLInputElement;
    input.focus();
    await user.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
    expect(input.value).toBe("10");
    await user.clear(input);
    await user.type(input, "500");
    await user.tab();
    expect(input.value).toBe("10");
  });

  it("formats currency for display", () => {
    render(<NumberField label="Budget" defaultValue={1500} formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />);
    expect((screen.getByRole("textbox", { name: "Budget" }) as HTMLInputElement).value).toBe("$1,500");
  });

  it("can hide the buttons", () => {
    render(<NumberField label="Age" showStepper={false} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("marks a required field, and shows an error", () => {
    render(<NumberField label="Age" isRequired isInvalid errorMessage="Enter your age" />);
    expect(screen.getByText("Enter your age")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Age/ })).toBeInvalid();
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("links the description to the field", () => {
    render(<NumberField label="Quantity" description="Between 1 and 99." />);
    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveAccessibleDescription("Between 1 and 99.");
  });

  it("can be disabled", () => {
    render(<NumberField label="Quantity" isDisabled />);
    expect(screen.getByRole("textbox", { name: "Quantity" })).toBeDisabled();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <NumberField label="One" defaultValue={1} description="Help" />
        <NumberField label="Two" showStepper={false} isInvalid errorMessage="Bad" />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

// jsdom never fires onError for these; keep an import used so a later edit can't drop the helpers silently.
void fireEvent;
