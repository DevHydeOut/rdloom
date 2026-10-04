import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Key } from "react-aria-components";
import { Combobox, ComboboxItem } from "../src";
import { axeViolations } from "./axe";
import { intersectAll } from "./setup";

const countries = ["France", "Germany", "India", "Japan", "Nigeria"].map((name) => ({
  id: name.toLowerCase(),
  name,
}));

function Countries(props: Partial<React.ComponentProps<typeof Combobox<(typeof countries)[number]>>>) {
  return (
    <Combobox label="Country" defaultItems={countries} {...props}>
      {(c) => <ComboboxItem id={c.id}>{c.name}</ComboboxItem>}
    </Combobox>
  );
}

function Markets(props: { onChange?: (keys: Key[]) => void; defaultValue?: Key[] }) {
  return (
    <Combobox label="Markets" selectionMode="multiple" defaultItems={countries} {...props}>
      {(c) => <ComboboxItem id={c.id}>{c.name}</ComboboxItem>}
    </Combobox>
  );
}

const input = (name: string) => screen.getByRole("combobox", { name });
const options = () => within(screen.getByRole("listbox")).getAllByRole("option").map((o) => o.textContent);
const tags = () => screen.queryAllByRole("button", { name: /^Remove / }).map((b) => b.getAttribute("aria-label"));

describe("Combobox (single)", () => {
  it("is named by its label", () => {
    render(<Countries placeholder="Search countries" />);
    expect(input("Country")).toBeInTheDocument();
  });

  it("filters as you type and selects with a click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Countries onChange={onChange} />);

    await user.type(input("Country"), "ger");
    expect(options()).toEqual(["Germany", "Nigeria"]); // "contains" match
    await user.click(screen.getByRole("option", { name: "Germany" }));

    expect(onChange).toHaveBeenLastCalledWith("germany");
    expect(input("Country")).toHaveValue("Germany");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens with ArrowDown and selects with Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Countries onChange={onChange} />);

    await user.tab();
    await user.keyboard("{ArrowDown}"); // opens with the first option focused
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledWith("germany");
  });

  it("shows the empty message from the spec default", async () => {
    const user = userEvent.setup();
    render(<Countries />);
    await user.type(input("Country"), "zzz");
    expect(screen.getByRole("listbox")).toHaveTextContent("No results");
  });

  it("keeps free text only when allowsCustomValue is set", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Countries label="Strict" />
        <Countries label="Free" allowsCustomValue />
      </>,
    );
    await user.type(input("Strict"), "Atlantis");
    await user.tab();
    await user.type(input("Free"), "Atlantis");
    await user.tab();

    expect(input("Strict")).toHaveValue("");
    expect(input("Free")).toHaveValue("Atlantis");
  });

  it("has no axe violations when open", async () => {
    const user = userEvent.setup();
    render(<Countries description="Where you live" />);
    await user.type(input("Country"), "a");
    expect(await axeViolations()).toEqual([]);
  });
});

describe("Combobox (multiple)", () => {
  it("adds tags, keeps the list open and reports every key", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Markets onChange={onChange} />);

    await user.type(input("Markets"), "ind");
    await user.click(screen.getByRole("option", { name: "India" }));
    expect(input("Markets")).toHaveValue(""); // cleared for the next search
    await user.type(input("Markets"), "jap");
    await user.click(screen.getByRole("option", { name: "Japan" }));

    expect(onChange).toHaveBeenLastCalledWith(["india", "japan"]);
    await user.keyboard("{Escape}");
    expect(tags()).toEqual(["Remove India", "Remove Japan"]);
  });

  it("keeps tags for options hidden by the current filter", async () => {
    const user = userEvent.setup();
    render(<Markets defaultValue={["india", "japan"]} />);

    await user.type(input("Markets"), "ger");
    expect(options()).toEqual(["Germany", "Nigeria"]);
    // While the list is open React Aria hides the rest of the page from
    // assistive tech, so look for the tags with hidden: true.
    const hiddenTags = screen.getAllByRole("button", { name: /^Remove /, hidden: true });
    expect(hiddenTags.map((b) => b.getAttribute("aria-label"))).toEqual(["Remove India", "Remove Japan"]);
  });

  it("removes a tag with its button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Markets defaultValue={["india", "japan"]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Remove India" }));
    expect(tags()).toEqual(["Remove Japan"]);
    expect(onChange).toHaveBeenLastCalledWith(["japan"]);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument(); // removing must not open the list
  });

  it("removes the last tag with Backspace in an empty input", async () => {
    const user = userEvent.setup();
    render(<Markets defaultValue={["india", "japan"]} />);

    await user.click(input("Markets"));
    await user.keyboard("{Backspace}");
    expect(tags()).toEqual(["Remove India"]);

    await user.keyboard("x{Backspace}"); // deletes the typed character, not a tag
    await user.keyboard("{Escape}"); // typing opened the list, which hides the tags
    expect(tags()).toEqual(["Remove India"]);
  });

  it("has no axe violations with tags and the list open", async () => {
    const user = userEvent.setup();
    render(<Markets defaultValue={["india"]} />);
    await user.type(input("Markets"), "a");
    expect(await axeViolations()).toEqual([]);
  });
});

describe("Combobox (async)", () => {
  it("announces loading and asks for more when the sentinel is reached", async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    const items = countries.slice(0, 3);
    const { rerender } = render(
      <Combobox label="User" items={items} isLoading onLoadMore={onLoadMore} menuTrigger="focus">
        {(c) => <ComboboxItem id={c.id}>{c.name}</ComboboxItem>}
      </Combobox>,
    );
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();

    rerender(
      <Combobox label="User" items={items} onLoadMore={onLoadMore} menuTrigger="focus">
        {(c) => <ComboboxItem id={c.id}>{c.name}</ComboboxItem>}
      </Combobox>,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await user.click(input("User"));
    expect(options()).toEqual(["France", "Germany", "India"]);
    act(() => intersectAll());
    expect(onLoadMore).toHaveBeenCalled();
  });

  it("names the loading row, so screen readers don't announce a blank option", async () => {
    const user = userEvent.setup();
    render(
      <Combobox label="User" items={countries.slice(0, 3)} isLoading onLoadMore={() => {}} menuTrigger="focus">
        {(c) => <ComboboxItem id={c.id}>{c.name}</ComboboxItem>}
      </Combobox>,
    );
    await user.click(input("User"));
    const rows = screen.getAllByRole("option");
    expect(rows.every((r) => r.textContent!.trim().length > 0)).toBe(true);
    expect(screen.getByRole("option", { name: "Loading more…" })).toBeInTheDocument();
  });
});
