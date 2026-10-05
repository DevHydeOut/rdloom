import { useState } from "react";
import { AgentActivity, updateTool, type ChatMessage, type ToolPart } from "@rdloom/react";

// While a step waits for an answer the list stays open: a question can't be hidden.
export default function AgentActivityNeedsApprovalExample() {
  const [message, setMessage] = useState<ChatMessage>({
    id: "m",
    role: "assistant",
    parts: [
      { type: "tool", id: "1", name: "lookup", title: "Finding overdue invoices", state: "done" },
      { type: "tool", id: "2", name: "email", title: "Email the customers", state: "awaiting-approval", approval: { summary: "Send a reminder to 8 customers", risk: "medium", reversible: false } },
    ],
  });
  const tools = message.parts.filter((p): p is ToolPart => p.type === "tool");
  return (
    <div className="w-[30rem] max-w-full">
      <AgentActivity
        tools={tools}
        onApprove={(id) => setMessage((m) => updateTool(m, id, { state: "approved" }))}
        onDeny={(id) => setMessage((m) => updateTool(m, id, { state: "denied" }))}
      />
    </div>
  );
}
