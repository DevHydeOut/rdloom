import { AgentActivity } from "@rdloom/react";

export default function AgentActivityWorkingExample() {
  return (
    <div className="w-[30rem] max-w-full">
      <AgentActivity
        defaultOpen
        tools={[
          { type: "tool", id: "1", name: "search", title: "Searching the knowledge base", state: "done", startedAt: "2026-03-01T10:00:00Z", endedAt: "2026-03-01T10:00:01.200Z" },
          { type: "tool", id: "2", name: "read", title: "Reading 3 documents", state: "running" },
          { type: "tool", id: "3", name: "write", title: "Writing the summary", state: "pending" },
        ]}
      />
    </div>
  );
}
