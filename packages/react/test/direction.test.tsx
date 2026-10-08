import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Direction, Radio, RadioGroup, Tab, TabList, TabPanel, Tabs, useDirection } from "../src";
import { axeViolations } from "./axe";

function Tabbed() {
  return (
    <Tabs>
      <TabList aria-label="Sections">
        <Tab id="a">One</Tab>
        <Tab id="b">Two</Tab>
        <Tab id="c">Three</Tab>
      </TabList>
      <TabPanel id="a">A</TabPanel>
      <TabPanel id="b">B</TabPanel>
      <TabPanel id="c">C</TabPanel>
    </Tabs>
  );
}

function Probe() {
  const { direction, locale } = useDirection();
  return <span data-testid="probe">{`${direction}:${locale}`}</span>;
}

describe("Direction", () => {
  it("writes the dir attribute and has no axe violations", async () => {
    const { container } = render(
      <Direction direction="rtl">
        <p>مرحبا</p>
      </Direction>,
    );
    expect(container.firstElementChild).toHaveAttribute("dir", "rtl");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("defaults to ltr", () => {
    const { container } = render(<Direction>text</Direction>);
    expect(container.firstElementChild).toHaveAttribute("dir", "ltr");
  });

  it("useDirection reports the nearest direction and locale", () => {
    render(
      <Direction direction="rtl" locale="he">
        <Probe />
        <Direction direction="ltr">
          <span data-testid="inner">
            <Probe />
          </span>
        </Direction>
      </Direction>,
    );
    expect(screen.getAllByTestId("probe")[0]).toHaveTextContent("rtl:he");
    expect(screen.getAllByTestId("probe")[1]).toHaveTextContent("ltr:en-US");
  });

  it("swaps arrow keys in Tabs for rtl", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <Direction direction="ltr">
        <Tabbed />
      </Direction>,
    );
    await user.click(screen.getByRole("tab", { name: "One" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
    unmount();

    render(
      <Direction direction="rtl">
        <Tabbed />
      </Direction>,
    );
    await user.click(screen.getByRole("tab", { name: "One" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Three" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "One" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
  });

  it("swaps arrow keys in a RadioGroup for rtl", async () => {
    const user = userEvent.setup();
    render(
      <Direction direction="rtl">
        <RadioGroup label="Plan" defaultValue="a" orientation="horizontal">
          <Radio value="a">A</Radio>
          <Radio value="b">B</Radio>
          <Radio value="c">C</Radio>
        </RadioGroup>
      </Direction>,
    );
    await user.click(screen.getByRole("radio", { name: "A" }));
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "B" })).toBeChecked();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "A" })).toBeChecked();
  });
});
