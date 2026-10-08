import { useState } from "react";
import { Message, MessageScroller, type ChatMessage } from "@rdloom/react";

const make = (from: number, to: number): ChatMessage[] =>
  Array.from({ length: to - from }, (_, i) => {
    const n = from + i;
    return { id: `m${n}`, role: n % 2 ? "assistant" : "user", parts: [{ type: "text", text: `Message ${n} in this conversation.` }] } as ChatMessage;
  });

export default function MessageScrollerLoadOlderExample() {
  const [messages, setMessages] = useState(() => make(21, 31));
  const [loading, setLoading] = useState(false);
  const oldest = Number(messages[0].id.slice(1));

  const loadOlder = () => {
    if (oldest <= 1) return;
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [...make(Math.max(1, oldest - 10), oldest), ...prev]);
      setLoading(false);
    }, 700);
  };

  return (
    <div className="flex w-full justify-center">
      <div className="h-72 w-full max-w-lg rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)]">
        <MessageScroller label="History" onReachTop={loadOlder} isLoadingOlder={loading}>
          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
        </MessageScroller>
      </div>
    </div>
  );
}
