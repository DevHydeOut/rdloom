import { ToolCall } from "@rdloom/react";

export default function ToolCallWithDetailsExample() {
  return (
    <div className="w-[30rem] max-w-full">
      <ToolCall
        defaultExpanded
        tool={{
          type: "tool",
          id: "sales",
          name: "query_sales",
          title: "Searching your sales data",
          state: "done",
          startedAt: "2026-03-01T10:00:00Z",
          endedAt: "2026-03-01T10:00:02.400Z",
          input: { from: "2026-02-01", to: "2026-02-28", groupBy: "week" },
          output: { rows: 4, total: 48210 },
        }}
      />
    </div>
  );
}
