import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AgentActivity,
  ApprovalBox,
  Chat,
  Citation,
  GeneratedChart,
  GeneratedTable,
  Message,
  PromptInput,
  Response,
  Sources,
  ToolCall,
  appendText,
  canMoveTool,
  finishMessage,
  groupParts,
  messageText,
  niceScale,
  pendingApproval,
  tableToCsv,
  toolDuration,
  updateTool,
  type ChatMessage,
  type CitationPart,
  type ToolPart,
  type ToolState,
} from "../src";
import { axeViolations } from "./axe";

const tool = (over: Partial<ToolPart> = {}): ToolPart => ({ type: "tool", id: "t1", name: "query_sales", title: "Searching your sales data", state: "running", ...over });
const sources: CitationPart[] = [
  { type: "citation", id: "a", title: "Refund policy", url: "https://www.example.com/policy", snippet: "Within 5 days." },
  { type: "citation", id: "b", title: "Handbook" },
];

describe("conversation helpers", () => {
  it("moves tool states forward only", () => {
    expect(canMoveTool("pending", "running")).toBe(true);
    expect(canMoveTool("running", "awaiting-approval")).toBe(true);
    expect(canMoveTool("awaiting-approval", "approved")).toBe(true);
    expect(canMoveTool("approved", "running")).toBe(true);
    expect(canMoveTool("running", "pending")).toBe(false);
    expect(canMoveTool("done", "running")).toBe(false);
    expect(canMoveTool("denied", "approved")).toBe(false);
    expect(canMoveTool("done", "done")).toBe(true);
  });

  it("updateTool changes one tool, ignores a backwards move, and never mutates", () => {
    const message: ChatMessage = { id: "m", role: "assistant", parts: [tool({ id: "a", state: "done" }), tool({ id: "b", state: "running" })] };
    const frozen = JSON.stringify(message);
    const next = updateTool(message, "b", { state: "done", output: 1 });
    expect((next.parts[1] as ToolPart).state).toBe("done");
    expect(JSON.stringify(message)).toBe(frozen);
    // a late update can't reopen a finished tool: the same object comes back
    expect(updateTool(next, "a", { state: "running" })).toBe(next);
    expect(updateTool(next, "missing", { state: "done" })).toBe(next);
  });

  it("appendText continues a streaming text part, and finishMessage ends it", () => {
    let m: ChatMessage = { id: "m", role: "assistant", parts: [] };
    m = appendText(m, "Hel");
    m = appendText(m, "lo");
    expect(m.parts).toEqual([{ type: "text", text: "Hello", streaming: true }]);
    expect(m.status).toBe("streaming");
    const done = finishMessage(m);
    expect(done.status).toBe("complete");
    expect(done.parts[0]).toMatchObject({ streaming: false });
    // text after a tool starts a new part
    const after = appendText({ ...done, parts: [...done.parts, tool()] }, "More");
    expect(after.parts).toHaveLength(3);
  });

  it("groups consecutive tools and finds the pending approval", () => {
    const parts = [{ type: "text" as const, text: "x" }, tool({ id: "1" }), tool({ id: "2", state: "awaiting-approval" }), { type: "text" as const, text: "y" }];
    const groups = groupParts(parts);
    expect(groups.map((g) => g.kind)).toEqual(["part", "tools", "part"]);
    expect(pendingApproval({ id: "m", role: "assistant", parts })?.id).toBe("2");
    expect(messageText({ id: "m", role: "assistant", parts })).toBe("x\n\ny");
  });

  it("formats how long a tool took", () => {
    expect(toolDuration({ startedAt: "2026-01-01T00:00:00Z", endedAt: "2026-01-01T00:00:00.400Z" })).toBe("400 ms");
    expect(toolDuration({ startedAt: "2026-01-01T00:00:00Z", endedAt: "2026-01-01T00:00:03.250Z" })).toBe("3.3 s");
    expect(toolDuration({ startedAt: "2026-01-01T00:00:00Z", endedAt: "2026-01-01T00:01:05Z" })).toBe("1 min 5 s");
    expect(toolDuration({ startedAt: "2026-01-01T00:00:00Z" })).toBeUndefined();
    expect(toolDuration({ startedAt: "nope", endedAt: "nah" })).toBeUndefined();
  });
});

describe("Response", () => {
  it("renders headings, lists, emphasis, quotes and inline code", () => {
    const { container } = render(<Response>{"# Title\n\nSome **bold** and _soft_ and `code`.\n\n- one\n- two\n\n1. first\n2. second\n\n> quoted"}</Response>);
    expect(screen.getByRole("heading", { level: 3, name: "Title" })).toBeInTheDocument();
    expect(container.querySelector("strong")).toHaveTextContent("bold");
    expect(container.querySelector("em")).toHaveTextContent("soft");
    expect(container.querySelector("p code")).toHaveTextContent("code");
    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
    expect(container.querySelector("blockquote")).toHaveTextContent("quoted");
  });

  it("starts headings at the level you choose and never goes past 6", () => {
    render(<Response headingLevel={4}>{"# A\n\n### B\n\n###### C"}</Response>);
    expect(screen.getByRole("heading", { name: "A" }).tagName).toBe("H4");
    expect(screen.getByRole("heading", { name: "B" }).tagName).toBe("H6");
    expect(screen.getByRole("heading", { name: "C" }).tagName).toBe("H6");
  });

  it("never injects HTML: markup in the text stays text", () => {
    const { container } = render(<Response>{'<img src=x onerror="alert(1)"> and <script>alert(2)</script> **ok**'}</Response>);
    expect(container.querySelector("img, script")).toBeNull();
    expect(container).toHaveTextContent('<img src=x onerror="alert(1)">');
    expect(container.querySelector("strong")).toHaveTextContent("ok");
  });

  it("drops links with unsafe schemes and marks outside links", () => {
    render(<Response>{"[bad](javascript:alert(1)) [worse](data:text/html,x) [good](https://example.com) [local](/docs/x)"}</Response>);
    expect(screen.queryByRole("link", { name: "bad" })).toBeNull();
    expect(screen.getByText(/bad/)).toBeInTheDocument();
    const good = screen.getByRole("link", { name: /good/ });
    expect(good).toHaveAttribute("href", "https://example.com");
    expect(good).toHaveAttribute("rel", "noopener noreferrer");
    expect(good).toHaveAttribute("target", "_blank");
    expect(good).toHaveAccessibleName("good (opens in a new tab)");
    expect(screen.getByRole("link", { name: "local" })).not.toHaveAttribute("target");
  });

  it("renders a table with headers and alignment", () => {
    render(<Response>{"| Name | Total |\n| :--- | ---: |\n| Ann | 12 |\n| Bo | 7 |"}</Response>);
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Name", "Total"]);
    expect(within(table).getByText("12")).toHaveClass("text-end");
    expect(screen.getByRole("region", { name: "Table" })).toHaveAttribute("tabindex", "0");
  });

  it("nests lists", () => {
    const { container } = render(<Response>{"- a\n  - a1\n  - a2\n- b"}</Response>);
    expect(container.querySelectorAll("ul ul > li")).toHaveLength(2);
    expect(container.firstElementChild!.querySelectorAll(":scope > ul > li")).toHaveLength(2);
  });

  it("shows a half-finished code block as code and doesn't throw", () => {
    const { container } = render(<Response isStreaming>{"Here:\n\n```ts\nconst a = 1;\nconst b ="}</Response>);
    expect(container.querySelector("pre code")?.textContent).toBe("const a = 1;\nconst b =");
    expect(screen.getByRole("button", { name: /copy/i })).toBeDisabled();
  });

  it("is busy while streaming and says nothing about it when finished", () => {
    const { container, rerender } = render(<Response isStreaming>Hi</Response>);
    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
    rerender(<Response>Hi</Response>);
    expect(container.firstChild).not.toHaveAttribute("aria-busy");
  });

  it("turns [n] into citation links only when that source exists", () => {
    render(<Response citations={sources}>{"Yes [1], and also [2] but not [7]."}</Response>);
    expect(screen.getByRole("link", { name: "Source 1: Refund policy" })).toHaveAttribute("href", "#source-a");
    expect(screen.getByRole("link", { name: "Source 2: Handbook" })).toBeInTheDocument();
    expect(screen.getByText(/\[7\]/)).toBeInTheDocument();
  });

  it("keeps line breaks inside a paragraph", () => {
    const { container } = render(<Response>{"line one\nline two"}</Response>);
    expect(container.querySelectorAll("p br")).toHaveLength(1);
  });

  it("copies a code block and says so", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Response>{"```js\nlet x = 1;\n```"}</Response>);
    await userEvent.click(screen.getByRole("button", { name: "Copy js code" }));
    expect(writeText).toHaveBeenCalledWith("let x = 1;");
    expect(await screen.findByText("Copied to clipboard")).toBeInTheDocument();
  });

  it("shows an image as a link and never loads it", () => {
    const { container } = render(<Response>{"Look ![a chart](https://tracker.example/pixel.png?u=1) and ![](javascript:alert(1))"}</Response>);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("link", { name: /a chart \(image\)/ })).toHaveAttribute("href", "https://tracker.example/pixel.png?u=1");
    expect(screen.queryByRole("link", { name: /^Image/ })).toBeNull();
  });

  it("links bare web addresses without taking the trailing punctuation", () => {
    render(<Response>{"See https://example.com/a/b, or (https://example.org). Not `https://x.test` in code."}</Response>);
    expect(screen.getByRole("link", { name: /example\.com\/a\/b/ })).toHaveAttribute("href", "https://example.com/a/b");
    expect(screen.getByRole("link", { name: /example\.org/ })).toHaveAttribute("href", "https://example.org");
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("lets a backslash keep a character literal", () => {
    const { container } = render(<Response>{"2 \\* 3 \\* 4 and 1\\. not a list"}</Response>);
    expect(container.querySelector("em")).toBeNull();
    expect(container).toHaveTextContent("2 * 3 * 4 and 1. not a list");
  });

  it("leaves snake_case words alone", () => {
    const { container } = render(<Response>{"call query_sales_data and read_me now"}</Response>);
    expect(container.querySelector("em")).toBeNull();
    expect(container).toHaveTextContent("call query_sales_data and read_me now");
  });

  it("doesn't read the markdown again when only unrelated things re-render", () => {
    const citations = [sources[0]];
    const { rerender, container } = render(<Response citations={citations}>{"A [1]"}</Response>);
    const link = container.querySelector("a");
    rerender(<Response citations={citations}>{"A [1]"}</Response>);
    expect(container.querySelector("a")).toBe(link);
  });

  it("renders on the server", () => {
    expect(renderToString(<Response>{"**hi**"}</Response>)).toContain("<strong>hi</strong>");
  });

  it("copes with a very long reply without slowing down", () => {
    const long = Array.from({ length: 400 }, (_, i) => `Paragraph ${i} with **bold**, _soft_ and [a link](https://example.com/${i}).\n\n- item a\n- item b\n`).join("\n");
    const started = performance.now();
    render(<Response>{long}</Response>);
    expect(performance.now() - started).toBeLessThan(3000);
  });
});

describe("Citation and Sources", () => {
  it("a marker is a link named after its source, and moves focus to the entry", async () => {
    render(
      <>
        <p>
          Claim <Citation index={1} source={sources[0]} />
        </p>
        <Sources sources={sources} />
      </>,
    );
    const marker = screen.getByRole("link", { name: "Source 1: Refund policy" });
    await userEvent.click(marker);
    expect(document.getElementById("source-a")).toHaveFocus();
  });

  it("lists the sources with the site and opens outside links in a new tab", () => {
    render(<Sources sources={sources} />);
    const region = screen.getByRole("region", { name: "Sources" });
    expect(within(region).getAllByRole("listitem")).toHaveLength(2);
    expect(within(region).getByText("example.com")).toBeInTheDocument();
    expect(within(region).getByRole("link", { name: /Refund policy/ })).toHaveAttribute("target", "_blank");
    expect(within(region).queryByRole("link", { name: /Handbook/ })).toBeNull();
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<Sources sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <p>
          Yes <Citation index={1} source={sources[0]} />
        </p>
        <Sources sources={sources} />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("ApprovalBox", () => {
  it("is a group named by what will happen, and announces itself", async () => {
    render(<ApprovalBox summary="Delete 12 drafts" risk="medium" reversible={false} />);
    expect(screen.getByRole("group", { name: "Delete 12 drafts" })).toBeInTheDocument();
    expect(await screen.findByRole("status")).toHaveTextContent("Approval needed: Delete 12 drafts. Medium risk. This can't be undone.");
    expect(screen.getByText("Medium risk")).toBeInTheDocument();
    expect(screen.getByText(/Can't be undone/)).toBeInTheDocument();
  });

  it("interrupts speech for high risk", async () => {
    render(<ApprovalBox summary="Wipe it" risk="high" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("High risk");
    expect(screen.getByRole("group")).toHaveAttribute("data-risk", "high");
  });

  it("calls back, with labels that name the action", async () => {
    const onApprove = vi.fn();
    const onDeny = vi.fn();
    render(<ApprovalBox summary="Send it" approveLabel="Send report" denyLabel="Hold" onApprove={onApprove} onDeny={onDeny} />);
    await userEvent.click(screen.getByRole("button", { name: "Hold" }));
    await userEvent.click(screen.getByRole("button", { name: "Send report" }));
    expect(onDeny).toHaveBeenCalledTimes(1);
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it("puts Deny before Approve in the tab order", () => {
    render(<ApprovalBox summary="x" />);
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Deny", "Approve"]);
  });

  it("takes focus on the box, not on a button, only when asked", () => {
    const { unmount } = render(<ApprovalBox summary="x" />);
    expect(screen.getByRole("group")).not.toHaveFocus();
    unmount();
    render(<ApprovalBox summary="x" autoFocus />);
    expect(screen.getByRole("group")).toHaveFocus();
  });

  it("blocks pressing while pending", () => {
    render(<ApprovalBox summary="x" isPending />);
    expect(screen.getByRole("button", { name: "Deny" })).toBeDisabled();
  });

  it("has no axe violations at each risk", async () => {
    for (const risk of ["low", "medium", "high"] as const) {
      const { container, unmount } = render(<ApprovalBox summary="Do the thing" risk={risk} reversible />);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });
});

describe("ToolCall", () => {
  const states: ToolState[] = ["pending", "running", "awaiting-approval", "approved", "denied", "done", "failed"];

  it("says every state in words, so none depends on color or an icon", () => {
    const words: Record<ToolState, string> = { pending: "Waiting", running: "Running", "awaiting-approval": "Needs your approval", approved: "Approved", denied: "Declined", done: "Done", failed: "Failed" };
    for (const state of states) {
      const { unmount } = render(<ToolCall tool={tool({ state })} />);
      expect(screen.getByRole("button", { name: new RegExp(words[state]) })).toBeInTheDocument();
      unmount();
    }
  });

  it("falls back to a readable name when there is no title", () => {
    render(<ToolCall tool={tool({ title: undefined, name: "query_salesData" })} />);
    expect(screen.getByText("Query sales Data")).toBeInTheDocument();
  });

  it("shows input and result on request, with aria-expanded", async () => {
    render(<ToolCall tool={tool({ state: "done", input: { month: "feb" }, output: [1, 2] })} />);
    const header = screen.getByRole("button", { name: /Searching your sales data/ });
    expect(header).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/"month": "feb"/)).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
  });

  it("has no expand control when there is nothing to show", () => {
    render(<ToolCall tool={tool({ state: "done" })} />);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-expanded");
  });

  it("shows the error and the duration", () => {
    render(<ToolCall tool={tool({ state: "failed", error: "Timed out", startedAt: "2026-01-01T00:00:00Z", endedAt: "2026-01-01T00:00:02Z" })} defaultExpanded />);
    expect(screen.getByText("Timed out")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /2\.0 s/ })).toBeInTheDocument();
  });

  it("copes with output that can't be turned into JSON, and cuts very long output", async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const { rerender } = render(<ToolCall tool={tool({ state: "done", output: circular })} defaultExpanded />);
    expect(screen.getByText("[object Object]")).toBeInTheDocument();
    rerender(<ToolCall tool={tool({ state: "done", output: "x".repeat(9000) })} defaultExpanded />);
    expect(screen.getByText(/5000 more characters/)).toBeInTheDocument();
  });

  it("announces a change once, and does not announce a tool that arrived finished", () => {
    const { rerender } = render(<ToolCall tool={tool({ state: "running" })} />);
    const status = () => screen.getAllByRole("status").find((n) => n.className.includes("sr-only"))!;
    expect(status()).toHaveTextContent("");
    rerender(<ToolCall tool={tool({ state: "done" })} />);
    expect(status()).toHaveTextContent("Searching your sales data: Done");
    rerender(<ToolCall tool={tool({ state: "failed", error: "Boom" })} />);
    expect(status()).toHaveTextContent("Searching your sales data: Failed. Boom");
  });

  it("shows the approval box, and after an answer sends focus back to the tool", async () => {
    function Harness() {
      const [m, setM] = useState<ChatMessage>({
        id: "m",
        role: "assistant",
        parts: [tool({ state: "awaiting-approval", approval: { summary: "Read all orders", risk: "low" } })],
      });
      return <ToolCall tool={m.parts[0] as ToolPart} onApprove={(id) => setM((x) => updateTool(x, id, { state: "approved" }))} />;
    }
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(screen.queryByRole("group", { name: "Read all orders" })).toBeNull();
    await waitFor(() => expect(screen.getByRole("button", { name: /Searching your sales data/ })).toHaveFocus());
  });

  it("focuses an approval box on arrival only when asked", () => {
    render(<ToolCall focusApproval tool={tool({ state: "awaiting-approval", approval: { summary: "Do it" } })} />);
    expect(screen.getByRole("group", { name: "Do it" })).toHaveFocus();
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(
      <div>
        {states.map((state) => (
          <ToolCall key={state} tool={tool({ id: state, state, error: state === "failed" ? "x" : undefined, approval: state === "awaiting-approval" ? { summary: "Ok?" } : undefined })} defaultExpanded />
        ))}
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("AgentActivity", () => {
  const done = tool({ id: "1", state: "done" });
  const failed = tool({ id: "2", state: "failed" });

  it("summarises finished work, closed by default", async () => {
    render(<AgentActivity tools={[done, failed, tool({ id: "3", state: "denied" })]} />);
    const button = screen.getByRole("button", { name: /Used 3 tools \(1 failed, 1 declined\)/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list", { name: "Steps" })).toBeNull();
    await userEvent.click(button);
    expect(within(screen.getByRole("list", { name: "Steps" })).getAllByRole("listitem")).toHaveLength(3);
  });

  it("says how far along unfinished work is", () => {
    render(<AgentActivity tools={[done, tool({ id: "2", state: "running" }), tool({ id: "3", state: "pending" })]} />);
    expect(screen.getByRole("button", { name: /Working: 1 of 3 steps done/ })).toBeInTheDocument();
  });

  it("stays open and can't be closed while a step waits for approval", () => {
    render(<AgentActivity tools={[done, tool({ id: "2", state: "awaiting-approval", approval: { summary: "Send it" } })]} />);
    const button = screen.getByRole("button", { name: /Waiting for your approval/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "Send it" })).toBeInTheDocument();
  });

  it("stays open after the question is answered, so the answered step is still there", async () => {
    function Harness() {
      const [t, setT] = useState<ToolPart>(tool({ state: "awaiting-approval", approval: { summary: "Send it" } }));
      return <AgentActivity tools={[t]} onApprove={() => setT((x) => ({ ...x, state: "approved" }))} />;
    }
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    // "approved" is not finished yet: the tool still has to run.
    expect(screen.getByRole("button", { name: /Working: 0 of 1 step/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Searching your sales data\s*,\s*Approved/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Working: 0 of 1 step/ }));
    expect(screen.queryByRole("list", { name: "Steps" })).toBeNull();
  });

  it("renders nothing without tools", () => {
    const { container } = render(<AgentActivity tools={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("says singular for one tool", () => {
    render(<AgentActivity tools={[done]} />);
    expect(screen.getByRole("button", { name: /Used 1 tool$/ })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<AgentActivity defaultOpen tools={[done, failed]} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("GeneratedTable", () => {
  const data = {
    columns: ["Region", "Revenue"],
    rows: [["Europe", 1200], ["Asia", 80], ["Americas", 9500], ["Africa", null]] as Array<Array<string | number | null>>,
  };

  it("is a table named by its title, with a summary", () => {
    render(<GeneratedTable title="Sales" data={data} />);
    expect(screen.getByRole("grid", { name: "Sales" })).toBeInTheDocument();
    expect(screen.getByText("4 rows, 2 columns")).toBeInTheDocument();
  });

  it("aligns number columns and formats the numbers", () => {
    render(<GeneratedTable title="Sales" data={data} />);
    expect(screen.getByRole("gridcell", { name: "9,500" })).toHaveClass("!text-end");
    expect(screen.getByRole("columnheader", { name: /Revenue/ })).toHaveClass("!text-end");
    expect(screen.getByRole("rowheader", { name: "Europe" })).not.toHaveClass("text-end");
  });

  it("sorts numbers by value and puts empty cells last", async () => {
    render(<GeneratedTable title="Sales" data={data} />);
    const order = () => screen.getAllByRole("row").slice(1).map((r) => within(r).getByRole("rowheader").textContent);
    expect(order()).toEqual(["Europe", "Asia", "Americas", "Africa"]);
    await userEvent.click(screen.getByRole("columnheader", { name: /Revenue/ }));
    expect(order()).toEqual(["Asia", "Europe", "Americas", "Africa"]);
    await userEvent.click(screen.getByRole("columnheader", { name: /Revenue/ }));
    expect(order()).toEqual(["Americas", "Europe", "Asia", "Africa"]);
  });

  it("cuts long tables and shows the rest on request", async () => {
    const rows = Array.from({ length: 12 }, (_, i) => [`Row ${i}`, i]);
    render(<GeneratedTable title="Long" maxRows={5} data={{ columns: ["A", "B"], rows }} />);
    expect(screen.getAllByRole("row")).toHaveLength(6);
    expect(screen.getByText("Showing 5 of 12 rows")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show all" }));
    expect(screen.getAllByRole("row")).toHaveLength(13);
    expect(screen.queryByText(/Showing 5/)).toBeNull();
  });

  it("writes a CSV that spreadsheets can't run as formulas", () => {
    const csv = tableToCsv({ columns: ["Name", "Note"], rows: [["=SUM(A1)", 'say "hi", ok'], ["+1", "-2"], ["@x", null], ["ok", 5]] });
    expect(csv).toBe(['Name,Note', `'=SUM(A1),"say ""hi"", ok"`, `'+1,'-2`, `'@x,`, "ok,5"].join("\r\n"));
  });

  it("downloads the CSV and says so, or hands the data to onExport", async () => {
    const create = vi.fn(() => "blob:x");
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const { rerender } = render(<GeneratedTable title="Sales" data={data} fileName="sales" />);
    await userEvent.click(screen.getByRole("button", { name: "Download CSV" }));
    expect(create).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(await screen.findByText("Downloaded sales.csv")).toBeInTheDocument();
    click.mockRestore();

    const onExport = vi.fn();
    rerender(<GeneratedTable title="Sales" data={data} onExport={onExport} />);
    await userEvent.click(screen.getByRole("button", { name: "Download CSV" }));
    expect(onExport).toHaveBeenCalledWith(data);
  });

  it("has no axe violations", async () => {
    const { container } = render(<GeneratedTable title="Sales" data={data} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("GeneratedChart", () => {
  const data = { labels: ["Jan", "Feb", "Mar"], series: [{ name: "Revenue", values: [10, 40, 25] }], unit: "$" };

  it("picks round axis numbers", () => {
    expect(niceScale(37)).toEqual({ max: 40, ticks: [0, 10, 20, 30, 40] });
    expect(niceScale(100).max).toBe(100);
    expect(niceScale(0)).toEqual({ max: 1, ticks: [0, 1] });
    expect(niceScale(Number.NaN).max).toBe(1);
    expect(niceScale(9500).ticks.at(-1)).toBeGreaterThanOrEqual(9500);
  });

  it("is a figure named by the title, with a written summary", () => {
    render(<GeneratedChart title="Revenue" data={data} />);
    expect(screen.getByRole("figure", { name: "Revenue" })).toBeInTheDocument();
    expect(screen.getByText(/Bar chart of Revenue across 3 points\. Revenue is highest at \$40 \(Feb\) and lowest at \$10 \(Jan\)/)).toBeInTheDocument();
  });

  it("uses the summary you write", () => {
    render(<GeneratedChart title="Revenue" summary="It went up and then down." data={data} />);
    expect(screen.getByText("It went up and then down.")).toBeInTheDocument();
  });

  it("hides the drawing from assistive tech and offers the same data as a table", async () => {
    const { container } = render(<GeneratedChart title="Revenue" data={data} />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    const toggle = screen.getByRole("button", { name: "View as table" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveTextContent("View as chart");
    const table = screen.getByRole("table");
    expect(within(table).getByRole("rowheader", { name: "Feb" })).toBeInTheDocument();
    expect(within(table).getByText("$40")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("draws a bar per value, or a line with a marker per point", () => {
    const { container, rerender } = render(<GeneratedChart title="R" data={data} />);
    expect(container.querySelectorAll("svg rect")).toHaveLength(3);
    rerender(<GeneratedChart title="R" type="line" data={data} />);
    expect(container.querySelectorAll("svg polyline")).toHaveLength(1);
    expect(container.querySelectorAll("svg circle")).toHaveLength(3);
  });

  it("names several series in a legend, with a different marker shape for each", () => {
    const { container } = render(
      <GeneratedChart
        title="Plans"
        type="line"
        data={{ labels: ["A", "B"], series: [{ name: "Free", values: [1, 2] }, { name: "Pro", values: [2, 3] }, { name: "Team", values: [3, 4] }] }}
      />,
    );
    const legend = screen.getByRole("list", { name: "Legend" });
    expect(within(legend).getAllByRole("listitem").map((i) => i.textContent)).toEqual(["Free", "Pro", "Team"]);
    const plot = container.querySelectorAll("figure > div > svg")[0];
    expect(plot.querySelectorAll("circle").length).toBe(2);
    expect(plot.querySelectorAll("rect").length).toBe(2);
    expect(plot.querySelectorAll("path[d*='Z']").length).toBe(2);
  });

  it("says so when there is no data", () => {
    render(<GeneratedChart title="Empty" data={{ labels: [], series: [] }} />);
    expect(screen.getByText("No data to chart.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /View as/ })).toBeNull();
  });

  it("handles negative and uneven series without throwing", () => {
    expect(() =>
      render(<GeneratedChart title="Odd" data={{ labels: ["a", "b", "c"], series: [{ name: "x", values: [-5, 3] }] }} />),
    ).not.toThrow();
  });

  it("has no axe violations as a chart or as a table", async () => {
    const { container } = render(<GeneratedChart title="Revenue" data={{ ...data, series: [...data.series, { name: "Cost", values: [5, 20, 10] }] }} />);
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "View as table" }));
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Message", () => {
  const assistant = (parts: ChatMessage["parts"], status?: ChatMessage["status"]): ChatMessage => ({ id: "m", role: "assistant", status, parts });

  it("names who wrote it", () => {
    render(
      <>
        <Message message={{ id: "1", role: "user", parts: [{ type: "text", text: "Hi" }] }} />
        <Message message={assistant([{ type: "text", text: "Hello" }])} />
      </>,
    );
    expect(screen.getByRole("article", { name: "You message" })).toHaveTextContent("Hi");
    expect(screen.getByRole("article", { name: "Assistant message" })).toHaveTextContent("Hello");
  });

  it("shows your text as plain text, not markdown", () => {
    const { container } = render(<Message message={{ id: "1", role: "user", parts: [{ type: "text", text: "**not bold** <b>x</b>" }] }} />);
    expect(container.querySelector("strong, b")).toBeNull();
    expect(container).toHaveTextContent("**not bold** <b>x</b>");
  });

  it("renders each part with its own component, in order", () => {
    render(
      <Message
        message={assistant([
          { type: "reasoning", text: "Thinking it over." },
          tool({ state: "done" }),
          { type: "text", text: "**Done.**" },
          { type: "artifact", kind: "table", title: "Rows", data: { columns: ["A"], rows: [[1]] } },
          { type: "artifact", kind: "chart", title: "Trend", data: { labels: ["x"], series: [{ name: "s", values: [1] }] } },
          { type: "file", name: "report.pdf", url: "/report.pdf" },
        ])}
      />,
    );
    expect(screen.getByRole("button", { name: "Reasoning" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Used 1 tool/ })).toBeInTheDocument();
    expect(screen.getByText("Done.").tagName).toBe("STRONG");
    expect(screen.getByRole("grid", { name: "Rows" })).toBeInTheDocument();
    expect(screen.getByRole("figure", { name: "Trend" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "report.pdf" })).toHaveAttribute("download", "report.pdf");
  });

  it("keeps reasoning closed until asked", async () => {
    render(<Message message={assistant([{ type: "reasoning", text: "Because." }])} />);
    expect(screen.queryByText("Because.")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Reasoning" }));
    expect(screen.getByText("Because.")).toBeInTheDocument();
  });

  it("collects citation parts into numbered markers and a Sources list", () => {
    render(<Message message={assistant([{ type: "text", text: "Yes [1][2]." }, ...sources])} />);
    expect(screen.getByRole("link", { name: "Source 1: Refund policy" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Sources" })).toBeInTheDocument();
  });

  it("says the assistant is thinking, in words, before any part arrives", () => {
    render(<Message message={assistant([], "streaming")} />);
    expect(screen.getByText("Assistant is thinking")).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveAttribute("aria-busy", "true");
  });

  it("announces a failure and offers to try again; says when stopped", async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<Message message={assistant([{ type: "text", text: "Partial" }], "error")} onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong.");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
    rerender(<Message message={assistant([{ type: "text", text: "Partial" }], "stopped")} />);
    expect(screen.getByText("Stopped")).toBeInTheDocument();
  });

  it("copies the assistant's text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Message message={assistant([{ type: "text", text: "One" }, { type: "text", text: "Two" }])} />);
    await userEvent.click(screen.getByRole("button", { name: "Copy message" }));
    expect(writeText).toHaveBeenCalledWith("One\n\nTwo");
    expect(await screen.findByText("Message copied")).toBeInTheDocument();
  });

  it("offers no copy button while streaming or on your own message", () => {
    const { rerender } = render(<Message message={assistant([{ type: "text", text: "x", streaming: true }], "streaming")} />);
    expect(screen.queryByRole("button", { name: /Copy message/ })).toBeNull();
    rerender(<Message message={{ id: "u", role: "user", parts: [{ type: "text", text: "x" }] }} />);
    expect(screen.queryByRole("button", { name: /Copy message/ })).toBeNull();
  });

  it("passes approvals up with the tool's id", async () => {
    const onApprove = vi.fn();
    render(<Message message={assistant([tool({ id: "zz", state: "awaiting-approval", approval: { summary: "Do it" } })])} onApprove={onApprove} />);
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(onApprove).toHaveBeenCalledWith("zz");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Message
        message={assistant([
          { type: "text", text: "# Heading\n\nText [1]\n\n```ts\nx\n```" },
          tool({ state: "done" }),
          { type: "artifact", kind: "chart", title: "Chart", data: { labels: ["a", "b"], series: [{ name: "s", values: [1, 2] }] } },
          sources[0],
        ])}
      />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("PromptInput", () => {
  it("sends on Enter, trimmed, clears, and keeps focus", async () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} />);
    const box = screen.getByRole("textbox", { name: "Message" });
    await userEvent.type(box, "  hello there  {Enter}");
    expect(onSubmit).toHaveBeenCalledWith("hello there");
    expect(box).toHaveValue("");
    expect(box).toHaveFocus();
  });

  it("Shift+Enter adds a line instead of sending", async () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} />);
    const box = screen.getByRole("textbox");
    await userEvent.type(box, "one{Shift>}{Enter}{/Shift}two");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(box).toHaveValue("one\ntwo");
  });

  it("ignores Enter while an input method is composing", () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} value="かん" onValueChange={() => {}} />);
    const box = screen.getByRole("textbox");
    fireEvent.keyDown(box, { key: "Enter", isComposing: true });
    fireEvent.keyDown(box, { key: "Enter", keyCode: 229 });
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("かん");
  });

  it("won't send nothing, or only spaces, and the Send button says so", async () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} />);
    const send = screen.getByRole("button", { name: "Send message" });
    expect(send).toBeDisabled();
    await userEvent.type(screen.getByRole("textbox"), "   {Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.type(screen.getByRole("textbox"), "x");
    expect(send).toBeEnabled();
    await userEvent.click(send);
    expect(onSubmit).toHaveBeenCalledWith("x");
  });

  it("turns into Stop while streaming and blocks sending", async () => {
    const onStop = vi.fn();
    const onSubmit = vi.fn();
    render(<PromptInput isStreaming onStop={onStop} onSubmit={onSubmit} value="x" onValueChange={() => {}} />);
    expect(screen.queryByRole("button", { name: "Send message" })).toBeNull();
    await userEvent.type(screen.getByRole("textbox"), "{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Stop generating" }));
    expect(onStop).toHaveBeenCalled();
  });

  it("can be controlled, and describes its shortcuts", async () => {
    function Controlled() {
      const [v, setV] = useState("a");
      return <PromptInput onSubmit={() => {}} value={v} onValueChange={setV} />;
    }
    render(<Controlled />);
    const box = screen.getByRole("textbox");
    await userEvent.type(box, "bc");
    expect(box).toHaveValue("abc");
    expect(box).toHaveAccessibleDescription("Enter to send, Shift+Enter for a new line");
  });

  it("disables everything", () => {
    render(<PromptInput onSubmit={() => {}} isDisabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("renders on the server", () => {
    expect(renderToString(<PromptInput onSubmit={() => {}} />)).toContain("textarea");
  });

  it("has no axe violations", async () => {
    const { container } = render(<PromptInput onSubmit={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Chat", () => {
  const user = (id: string, text: string): ChatMessage => ({ id, role: "user", parts: [{ type: "text", text }] });
  const reply = (id: string, text: string, status: ChatMessage["status"] = "complete"): ChatMessage => ({ id, role: "assistant", status, parts: [{ type: "text", text }] });

  it("is a labelled region with a message log that is not live", () => {
    render(<Chat label="Support" messages={[user("1", "Hi"), reply("2", "Hello")]} onSend={() => {}} />);
    expect(screen.getByRole("region", { name: "Support" })).toBeInTheDocument();
    const log = screen.getByRole("log", { name: "Support messages" });
    expect(log).toHaveAttribute("aria-live", "off");
    // reachable by keyboard so it can scroll
    expect(log).toHaveAttribute("tabindex", "0");
    expect(within(log).getAllByRole("article")).toHaveLength(2);
  });

  it("offers suggestions when empty, and choosing one sends it", async () => {
    const onSend = vi.fn();
    render(<Chat messages={[]} suggestions={["Show sales", "List customers"]} onSend={onSend} />);
    expect(screen.getByText("Ask anything to get started.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "List customers" }));
    expect(onSend).toHaveBeenCalledWith("List customers");
  });

  it("sends what is typed, and shows Stop while a reply streams", async () => {
    const onSend = vi.fn();
    const onStop = vi.fn();
    const { rerender } = render(<Chat messages={[]} onSend={onSend} />);
    await userEvent.type(screen.getByRole("textbox"), "Hello{Enter}");
    expect(onSend).toHaveBeenCalledWith("Hello");
    rerender(<Chat messages={[user("1", "Hello"), reply("2", "Hi", "streaming")]} status="streaming" onSend={onSend} onStop={onStop} />);
    await userEvent.click(screen.getByRole("button", { name: "Stop generating" }));
    expect(onStop).toHaveBeenCalled();
    expect(screen.getByRole("log", { name: /messages$/ })).toHaveAttribute("aria-busy", "true");
  });

  it("announces a reply starting and finishing, once each, never per token", () => {
    const status = () => screen.getAllByRole("status").find((n) => /responding|complete|wrong/.test(n.textContent ?? "") || n.parentElement?.tagName === "SECTION");
    const { rerender } = render(<Chat messages={[user("1", "Hi")]} onSend={() => {}} />);
    const live = () => screen.getAllByRole("status").filter((n) => n.parentElement?.tagName === "SECTION")[0];
    expect(live()).toHaveTextContent("");
    rerender(<Chat messages={[user("1", "Hi")]} status="submitted" onSend={() => {}} />);
    expect(live()).toHaveTextContent("Assistant is responding");
    rerender(<Chat messages={[user("1", "Hi"), reply("2", "H", "streaming")]} status="streaming" onSend={() => {}} />);
    rerender(<Chat messages={[user("1", "Hi"), reply("2", "Hi th", "streaming")]} status="streaming" onSend={() => {}} />);
    expect(live()).toHaveTextContent("Assistant is responding");
    rerender(<Chat messages={[user("1", "Hi"), reply("2", "Hi there")]} status="ready" onSend={() => {}} />);
    expect(live()).toHaveTextContent("Response complete");
    rerender(<Chat messages={[user("1", "Hi")]} status="error" onSend={() => {}} />);
    expect(live()).toHaveTextContent("Something went wrong with the response");
    expect(status()).toBeDefined();
  });

  it("shows a thinking message while waiting for the first words", () => {
    render(<Chat messages={[user("1", "Hi")]} status="submitted" onSend={() => {}} />);
    expect(screen.getByText("Assistant is thinking")).toBeInTheDocument();
  });

  it("lets only the newest unanswered approval take focus", () => {
    const ask = (id: string, summary: string): ChatMessage => ({
      id,
      role: "assistant",
      parts: [{ type: "tool", id: `t-${id}`, name: "x", title: summary, state: "awaiting-approval", approval: { summary } }],
    });
    render(<Chat messages={[ask("a", "First question"), user("u", "ok"), ask("b", "Second question")]} onSend={() => {}} />);
    expect(screen.getByRole("group", { name: "Second question" })).toHaveFocus();
    expect(screen.getByRole("group", { name: "First question" })).not.toHaveFocus();
  });

  it("follows new text, until the reader scrolls up; then offers Jump to latest", () => {
    const { rerender } = render(<Chat messages={[user("1", "Hi")]} onSend={() => {}} />);
    const log = screen.getByRole("log", { name: /messages$/ });
    let scrollTop = 0;
    Object.defineProperty(log, "scrollHeight", { configurable: true, get: () => 1000 });
    Object.defineProperty(log, "clientHeight", { configurable: true, get: () => 400 });
    Object.defineProperty(log, "scrollTop", { configurable: true, get: () => scrollTop, set: (v) => (scrollTop = v) });

    rerender(<Chat messages={[user("1", "Hi"), reply("2", "More", "streaming")]} status="streaming" onSend={() => {}} />);
    expect(scrollTop).toBe(1000);

    scrollTop = 100; // the reader scrolled up
    fireEvent.scroll(log);
    expect(screen.getByRole("button", { name: "Jump to latest" })).toBeInTheDocument();
    rerender(<Chat messages={[user("1", "Hi"), reply("2", "More more", "streaming")]} status="streaming" onSend={() => {}} />);
    expect(scrollTop).toBe(100); // not dragged back down while reading

    act(() => screen.getByRole("button", { name: "Jump to latest" }).click());
    expect(scrollTop).toBe(1000);
    expect(screen.queryByRole("button", { name: "Jump to latest" })).toBeNull();
  });

  it("runs a whole turn with tools through the keyboard", async () => {
    function App() {
      const [messages, setMessages] = useState<ChatMessage[]>([]);
      return (
        <Chat
          messages={messages}
          onSend={(text) =>
            setMessages([
              user("u", text),
              { id: "a", role: "assistant", parts: [{ type: "tool", id: "t", name: "mail", title: "Send the email", state: "awaiting-approval", approval: { summary: "Email finance", risk: "medium" } }] },
            ])
          }
          onApprove={(id) => setMessages((m) => m.map((x) => (x.role === "assistant" ? updateTool(x, id, { state: "approved" }) : x)))}
        />
      );
    }
    render(<App />);
    await userEvent.type(screen.getByRole("textbox"), "Send it{Enter}");
    expect(screen.getByRole("group", { name: "Email finance" })).toHaveFocus();
    await userEvent.tab(); // Deny
    await userEvent.tab(); // Approve
    await userEvent.keyboard("{Enter}");
    expect(screen.queryByRole("group", { name: "Email finance" })).toBeNull();
    expect(screen.getByRole("button", { name: /Send the email\s*,\s*Approved/ })).toBeInTheDocument();
  });

  it("renders on the server, empty or full", () => {
    expect(renderToString(<Chat messages={[]} suggestions={["Hi"]} onSend={() => {}} />)).toContain("Ask anything to get started.");
    const full = renderToString(
      <Chat
        messages={[user("1", "Hi"), { id: "2", role: "assistant", parts: [tool({ state: "done" }), { type: "text", text: "**yes**" }, { type: "artifact", kind: "chart", title: "C", data: { labels: ["a"], series: [{ name: "s", values: [1] }] } }] }]}
        onSend={() => {}}
      />,
    );
    expect(full).toContain("<strong>yes</strong>");
  });

  it("has no axe violations, empty or full", async () => {
    const { container, rerender } = render(<Chat messages={[]} suggestions={["a", "b"]} onSend={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
    rerender(
      <Chat
        messages={[
          user("1", "Show sales"),
          { id: "2", role: "assistant", parts: [tool({ state: "done" }), { type: "text", text: "Here:\n\n- one\n- two [1]" }, sources[0], { type: "artifact", kind: "table", title: "T", data: { columns: ["a"], rows: [[1]] } }] },
        ]}
        onSend={() => {}}
      />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
