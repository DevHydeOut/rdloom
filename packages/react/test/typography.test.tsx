import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Blockquote, H1, H2, H3, H4, Heading, InlineCode, Lead, List, ListItem, Prose, Text } from "../src";
import { axeViolations } from "./axe";

describe("Heading", () => {
  it("renders h1 to h4 from the helpers", () => {
    render(
      <>
        <H1>One</H1>
        <H2>Two</H2>
        <H3>Three</H3>
        <H4>Four</H4>
      </>,
    );
    for (const [level, name] of [[1, "One"], [2, "Two"], [3, "Three"], [4, "Four"]] as const) {
      expect(screen.getByRole("heading", { level, name })).toBeInTheDocument();
    }
  });

  it("keeps the level and the visual size independent", () => {
    render(
      <Heading level={2} size="sm">
        Small h2
      </Heading>,
    );
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveClass("text-base");
    render(<H4 size="2xl">Big h4</H4>);
    expect(screen.getByRole("heading", { level: 4 })).toHaveClass("text-4xl");
  });

  it("clamps an out of range level", () => {
    render(<Heading level={9 as 4}>Clamped</Heading>);
    expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument();
  });

  it("merges className and forwards the ref", () => {
    let node: HTMLHeadingElement | null = null;
    render(
      <H2 className="extra" ref={(n) => (node = n)}>
        x
      </H2>,
    );
    expect(node).toHaveClass("extra");
  });
});

describe("Text", () => {
  it("is a paragraph by default and a span with as", () => {
    const { container } = render(
      <>
        <Text>Para</Text>
        <Text as="span">Span</Text>
      </>,
    );
    expect(container.querySelector("p")).toHaveTextContent("Para");
    expect(container.querySelector("span")).toHaveTextContent("Span");
  });

  it("sets size and tone with tokens", () => {
    render(
      <Text size="sm" tone="danger">
        Bad
      </Text>,
    );
    const el = screen.getByText("Bad");
    expect(el).toHaveClass("text-sm", "text-[var(--rd-color-feedback-danger)]");
  });

  it("never sets a font family", () => {
    const { container } = render(
      <>
        <Lead>Lead</Lead>
        <Text>Text</Text>
        <Prose>
          <p>Body</p>
        </Prose>
      </>,
    );
    expect(container.innerHTML).not.toMatch(/font-(sans|serif)|font-family/);
  });
});

describe("Prose, lists and quote", () => {
  it("wraps raw HTML", () => {
    render(
      <Prose>
        <h2>Title</h2>
        <p>
          Body with <a href="/x">a link</a> and <code>code</code>.
        </p>
        <ul>
          <li>One</li>
        </ul>
        <table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </table>
      </Prose>,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Title" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "a link" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders unordered and ordered lists with list items", () => {
    render(
      <>
        <List aria-label="Bullets">
          <ListItem>A</ListItem>
        </List>
        <List ordered aria-label="Steps">
          <ListItem>B</ListItem>
        </List>
      </>,
    );
    expect(screen.getByRole("list", { name: "Bullets" }).tagName).toBe("UL");
    expect(screen.getByRole("list", { name: "Steps" }).tagName).toBe("OL");
  });

  it("renders a quote with a source", () => {
    const { container } = render(<Blockquote source="Someone">Words</Blockquote>);
    expect(container.querySelector("blockquote")).toHaveTextContent("Words");
    expect(container.querySelector("footer")).toHaveTextContent("Someone");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <main>
        <H1>Page</H1>
        <Lead>Intro</Lead>
        <Text tone="muted">Muted</Text>
        <List>
          <ListItem>
            Use <InlineCode>npm</InlineCode>
          </ListItem>
        </List>
        <Blockquote source="Me">Quote</Blockquote>
        <Prose>
          <h2>Section</h2>
          <p>Body</p>
          <hr />
        </Prose>
      </main>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
