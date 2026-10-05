import { ToolCall, type ToolPart, type ToolState } from "@rdloom/react";

const states: ToolState[] = ["pending", "running", "awaiting-approval", "approved", "denied", "done", "failed"];

const tool = (state: ToolState): ToolPart => ({
  type: "tool",
  id: state,
  name: "query_sales",
  title: "Searching your sales data",
  state,
  startedAt: "2026-03-01T10:00:00Z",
  endedAt: state === "done" ? "2026-03-01T10:00:03Z" : undefined,
  error: state === "failed" ? "The database did not answer in time." : undefined,
  approval: state === "awaiting-approval" ? { summary: "Read every order from the last 12 months", risk: "low" } : undefined,
});

// Every state has its own icon and its own words: nothing depends on color alone.
export default function ToolCallStatesExample() {
  return (
    <div className="flex w-[30rem] max-w-full flex-col gap-2">
      {states.map((state) => (
        <ToolCall key={state} tool={tool(state)} />
      ))}
    </div>
  );
}
