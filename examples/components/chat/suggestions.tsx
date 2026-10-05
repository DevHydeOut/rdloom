import { useState } from "react";
import { Chat, type ChatMessage } from "@rdloom/react";

// An empty chat can offer ways to start. Choosing one sends it like any message.
export default function ChatSuggestionsExample() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  return (
    <div className="h-[24rem] w-[40rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <Chat
        label="Assistant"
        messages={messages}
        suggestions={["Summarise last month's sales", "Which customers are overdue?", "Draft a reminder email"]}
        onSend={(text) =>
          setMessages((m) => [
            ...m,
            { id: `u${m.length}`, role: "user", parts: [{ type: "text", text }] },
            { id: `a${m.length}`, role: "assistant", parts: [{ type: "text", text: "This demo doesn't call a model: you decide what happens in onSend." }] },
          ])
        }
      />
    </div>
  );
}
