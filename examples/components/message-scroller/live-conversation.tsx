import { useState } from "react";
import { Button, Message, MessageScroller, type ChatMessage } from "@rdloom/react";

const replies = [
  "Your order shipped this morning.",
  "It should arrive on Thursday.",
  "I can change the delivery address until it leaves the depot.",
  "Anything else I can check for you?",
];

const first: ChatMessage[] = [
  { id: "m1", role: "user", parts: [{ type: "text", text: "Where is my order?" }] },
  { id: "m2", role: "assistant", parts: [{ type: "text", text: "Let me look that up." }] },
];

export default function MessageScrollerLiveConversationExample() {
  const [messages, setMessages] = useState(first);
  const add = () =>
    setMessages((prev) => {
      const n = prev.length;
      const mine = n % 2 === 0;
      const text = mine ? "Can you change the address?" : replies[(n - 1) / 2 % replies.length | 0];
      return [...prev, { id: `m${n + 1}`, role: mine ? "user" : "assistant", parts: [{ type: "text", text }] }];
    });
  return (
    <div className="flex w-full justify-center py-4">
      <div className="flex w-[36rem] max-w-full flex-col gap-4">
        <div className="h-72 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)]">
          <MessageScroller label="Order support">
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
          </MessageScroller>
        </div>
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" onPress={add}>
            Add a message
          </Button>
        </div>
      </div>
    </div>
  );
}
