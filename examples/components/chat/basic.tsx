import { useEffect, useRef, useState } from "react";
import { Chat, appendText, finishMessage, type ChatMessage } from "@rdloom/react";

const reply =
  "Happy to help. **Rdloom** components are spec-driven and accessible, so you copy the source into your project and own it.\n\nWant a tour of the data grid next?";

type Status = "ready" | "submitted" | "streaming";

// The chat only shows what you pass in. Here a timer plays the part of a model.
export default function ChatBasicExample() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>("ready");
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => () => clearInterval(timer.current), []);

  const send = (text: string) => {
    const id = Date.now();
    setMessages((m) => [...m, { id: `u${id}`, role: "user", parts: [{ type: "text", text }] }]);
    setStatus("submitted");
    let at = 0;
    timer.current = setInterval(() => {
      const chunk = reply.slice(at, at + 4);
      at += 4;
      setStatus("streaming");
      setMessages((m) => {
        const last = m[m.length - 1];
        const current: ChatMessage = last?.role === "assistant" ? last : { id: `a${id}`, role: "assistant", parts: [] };
        const next = appendText(current, chunk);
        return last?.role === "assistant" ? [...m.slice(0, -1), next] : [...m, next];
      });
      if (at >= reply.length) {
        clearInterval(timer.current);
        setMessages((m) => [...m.slice(0, -1), finishMessage(m[m.length - 1])]);
        setStatus("ready");
      }
    }, 60);
  };

  const stop = () => {
    clearInterval(timer.current);
    setMessages((m) => (m.length ? [...m.slice(0, -1), finishMessage(m[m.length - 1], "stopped")] : m));
    setStatus("ready");
  };

  return (
    <div className="h-[28rem] w-[40rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <Chat label="Assistant" messages={messages} status={status} onSend={send} onStop={stop} />
    </div>
  );
}
