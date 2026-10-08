import { useEffect, useRef, useState } from "react";
import { Message, MessageScroller, type ChatMessage } from "@rdloom/react";

const seed: ChatMessage[] = Array.from({ length: 12 }, (_, i) => ({
  id: `m${i + 1}`,
  role: i % 2 ? "assistant" : "user",
  parts: [{ type: "text", text: `Earlier message ${i + 1}.` }],
}));

export default function MessageScrollerUnreadCountExample() {
  const [messages, setMessages] = useState(seed);
  const [unread, setUnread] = useState(0);
  const atBottom = useRef(true);

  // A new message arrives every few seconds; scroll up in the box to see the count grow.
  useEffect(() => {
    const timer = setInterval(() => {
      setMessages((prev) => [...prev, { id: `m${prev.length + 1}`, role: "assistant", parts: [{ type: "text", text: `New message ${prev.length + 1}.` }] }]);
      if (!atBottom.current) setUnread((n) => n + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex w-full justify-center py-4">
      <div className="h-72 w-[36rem] max-w-full rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)]">
        <MessageScroller label="Team thread" unreadCount={unread}
          onAtBottomChange={(v) => {
            atBottom.current = v;
            if (v) setUnread(0);
          }}
        >
          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
        </MessageScroller>
      </div>
    </div>
  );
}
