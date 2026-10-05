import { useState } from "react";
import { ToolCall, updateTool, type ChatMessage } from "@rdloom/react";

// You own the state. Approving or declining moves the tool forward; focus returns to the tool.
export default function ToolCallNeedsApprovalExample() {
  const [message, setMessage] = useState<ChatMessage>({
    id: "m",
    role: "assistant",
    parts: [
      {
        type: "tool",
        id: "t",
        name: "delete_drafts",
        title: "Delete draft invoices",
        state: "awaiting-approval",
        approval: { summary: "Delete 12 draft invoices", risk: "high", reversible: false },
      },
    ],
  });
  const tool = message.parts[0];
  return (
    <div className="w-[30rem] max-w-full">
      {tool.type === "tool" && (
        <ToolCall
          tool={tool}
          onApprove={(id) => setMessage((m) => updateTool(m, id, { state: "approved" }))}
          onDeny={(id) => setMessage((m) => updateTool(m, id, { state: "denied" }))}
        />
      )}
    </div>
  );
}
