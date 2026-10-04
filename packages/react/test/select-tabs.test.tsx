import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select, SelectItem, Tab, TabList, TabPanel, Tabs } from "../src";
import { axeViolations } from "./axe";

function CountrySelect(props: { onSelectionChange?: (key: unknown) => void }) {
  return (
    <Select label="Country" {...props}>
      <SelectItem id="in">India</SelectItem>
      <SelectItem id="us">United States</SelectItem>
      <SelectItem id="de">Germany</SelectItem>
    </Select>
  );
}

describe("Select", () => {
  it("shows the placeholder from the spec default", () => {
    render(<CountrySelect />);
    expect(screen.getByRole("button", { name: /Country/ })).toHaveTextContent("Select an option");
  });

  it("opens, selects an option and closes", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<CountrySelect onSelectionChange={onSelectionChange} />);

    await user.click(screen.getByRole("button", { name: /Country/ }));
    const listbox = screen.getByRole("listbox");
    await user.click(within(listbox).getByRole("option", { name: "Germany" }));

    expect(onSelectionChange).toHaveBeenCalledWith("de");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Country/ })).toHaveTextContent("Germany");
  });

  it("works from the keyboard", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<CountrySelect onSelectionChange={onSelectionChange} />);

    await user.tab();
    await user.keyboard("{ArrowDown}"); // opens with the first option focused
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelectionChange).toHaveBeenCalledWith("us");
  });

  it("has no axe violations when open", async () => {
    const user = userEvent.setup();
    render(<CountrySelect />);
    await user.click(screen.getByRole("button", { name: /Country/ }));
    expect(await axeViolations()).toEqual([]);
  });
});

function ProjectTabs() {
  return (
    <Tabs defaultSelectedKey="overview">
      <TabList aria-label="Project">
        <Tab id="overview">Overview</Tab>
        <Tab id="activity">Activity</Tab>
      </TabList>
      <TabPanel id="overview">Overview content</TabPanel>
      <TabPanel id="activity">Activity content</TabPanel>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("switches panels with arrow keys", async () => {
    const user = userEvent.setup();
    render(<ProjectTabs />);

    expect(screen.getByRole("tabpanel")).toHaveTextContent("Overview content");
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Activity content");
  });

  it("shares the variant with every tab", () => {
    render(
      <Tabs variant="pill" defaultSelectedKey="a">
        <TabList aria-label="Range">
          <Tab id="a">Day</Tab>
        </TabList>
        <TabPanel id="a">Day</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole("tab").className).toContain("rounded-");
  });

  it("has no axe violations", async () => {
    render(<ProjectTabs />);
    expect(await axeViolations()).toEqual([]);
  });
});
