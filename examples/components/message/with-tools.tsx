import { Message, type ChatMessage } from "@rdloom/react";

const message: ChatMessage = {
  id: "1",
  role: "assistant",
  parts: [
    { type: "reasoning", text: "The question is about last month, so I'll query orders for February and group them by week." },
    { type: "tool", id: "q", name: "query_orders", title: "Searching your orders", state: "done", startedAt: "2026-03-01T10:00:00Z", endedAt: "2026-03-01T10:00:02Z", input: { month: "2026-02" }, output: { rows: 4 } },
    { type: "tool", id: "c", name: "make_chart", title: "Creating a chart", state: "done" },
    { type: "text", text: "Orders peaked in the third week." },
  ],
};

export default function MessageWithToolsExample() {
  return (
    <div className="w-[36rem] max-w-full">
      <Message message={message} />
    </div>
  );
}
