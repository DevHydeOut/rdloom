import { useEffect, useRef, useState } from "react";
import { Chat, finishMessage, updateTool, type ChatMessage } from "@rdloom/react";

const now = () => new Date().toISOString();

// A scripted run: a tool works, a second one asks for approval, and then a chart and a table arrive.
export default function ChatWithToolsExample() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming">("ready");
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (ms: number, run: () => void) => void timers.current.push(window.setTimeout(run, ms));
  const patch = (change: (m: ChatMessage) => ChatMessage) => setMessages((list) => list.map((m, i) => (i === list.length - 1 ? change(m) : m)));

  const send = (text: string) => {
    setMessages((m) => [...m, { id: `u${m.length}`, role: "user", parts: [{ type: "text", text }] }]);
    setStatus("submitted");
    later(500, () => {
      setStatus("streaming");
      setMessages((m) => [
        ...m,
        { id: `a${m.length}`, role: "assistant", status: "streaming", parts: [{ type: "tool", id: "q", name: "query_sales", title: "Searching your sales data", state: "running", startedAt: now() }] },
      ]);
    });
    later(1700, () => patch((m) => updateTool(m, "q", { state: "done", endedAt: now(), output: { weeks: 4 } })));
    later(1800, () =>
      patch((m) => ({
        ...m,
        parts: [
          ...m.parts,
          { type: "tool", id: "s", name: "email_report", title: "Email the report to finance", state: "awaiting-approval", approval: { summary: "Email this report to finance@example.com", risk: "medium", reversible: false } },
        ],
      })),
    );
  };

  const finish = (sent: boolean) => {
    later(700, () => {
      patch((m) => (sent ? updateTool(m, "s", { state: "done" }) : m));
      patch((m) =>
        finishMessage({
          ...m,
          parts: [
            ...m.parts,
            { type: "text", text: sent ? "Sent. Here is last month at a glance:" : "Okay, I won't send it. Here is last month at a glance:" },
            {
              type: "artifact",
              kind: "chart",
              title: "Revenue by week",
              summary: "Revenue rose every week, from $9.2K to $15.8K.",
              data: { labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"], series: [{ name: "Revenue", values: [9200, 11400, 13100, 15800] }], unit: "$" },
            },
          ],
        }),
      );
      setStatus("ready");
    });
  };

  return (
    <div className="h-[32rem] w-[44rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <Chat
        label="Assistant"
        messages={messages}
        status={status}
        suggestions={["Show me sales from last month"]}
        onSend={send}
        onApprove={(id) => {
          patch((m) => updateTool(m, id, { state: "approved" }));
          finish(true);
        }}
        onDeny={(id) => {
          patch((m) => updateTool(m, id, { state: "denied" }));
          finish(false);
        }}
      />
    </div>
  );
}
