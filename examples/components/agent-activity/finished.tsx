import { AgentActivity } from "@rdloom/react";

// Collapsed once it is done: "Used 3 tools (1 failed)". Open it to see each step.
export default function AgentActivityFinishedExample() {
  return (
    <div className="w-[30rem] max-w-full">
      <AgentActivity
        tools={[
          { type: "tool", id: "1", name: "search", title: "Searching the knowledge base", state: "done", startedAt: "2026-03-01T10:00:00Z", endedAt: "2026-03-01T10:00:01Z" },
          { type: "tool", id: "2", name: "fetch", title: "Fetching the pricing page", state: "failed", error: "The page returned 404." },
          { type: "tool", id: "3", name: "calc", title: "Calculating totals", state: "done", startedAt: "2026-03-01T10:00:02Z", endedAt: "2026-03-01T10:00:02.100Z" },
        ]}
      />
    </div>
  );
}
