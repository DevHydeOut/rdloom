import { useEffect, useRef, useState } from "react";
import { Chat, appendText, finishMessage, updateTool, type ChatMessage } from "@rdloom/react";

// A made-up assistant that shows every state a real one goes through: sending, streaming, a tool that needs
// approval, a failure half way, Try again, and Stop. Nothing here calls a model: the timers stand in for your server,
// and every `onSomething` is where your own code would go. Try each suggestion, and press Stop while it streams.

const now = () => new Date().toISOString();
const SUMMARY = "Revenue rose every week last month, from $9.2K to $15.8K, and refunds stayed under 2%.".split(" ");

export default function ChatSimulatedRunExample() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");
  const timers = useRef<number[]>([]);
  const failures = useRef(0); // The "break it" prompt fails once, so Try again can succeed.
  const lastPrompt = useRef("");
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (ms: number, run: () => void) => void timers.current.push(window.setTimeout(run, ms));
  const cancelAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const patch = (change: (m: ChatMessage) => ChatMessage) => setMessages((list) => list.map((m, i) => (i === list.length - 1 ? change(m) : m)));

  // Streams the words one by one; `breakAt` fails the reply after that many words.
  const stream = (breakAt?: number) => {
    let i = 0;
    const next = () => {
      if (breakAt !== undefined && i === breakAt) {
        patch((m) => finishMessage(m, "error"));
        setStatus("error");
        return;
      }
      if (i >= SUMMARY.length) return afterText();
      const word = SUMMARY[i++]!;
      patch((m) => appendText(m, (i > 1 ? " " : "") + word));
      later(110, next);
    };
    next();
  };

  const afterText = () => {
    if (!/report|send/i.test(lastPrompt.current)) {
      patch((m) => finishMessage(m));
      setStatus("ready");
      return;
    }
    // A tool that changes something outside the chat waits for the person's yes.
    patch((m) => ({
      ...m,
      parts: [
        ...m.parts,
        { type: "tool", id: "mail", name: "email_report", title: "Email this summary to finance", state: "awaiting-approval", approval: { summary: "Email the summary to finance@example.com", risk: "medium", reversible: false } },
      ],
    }));
  };

  const reply = () => {
    setStatus("submitted");
    later(600, () => {
      setStatus("streaming");
      setMessages((m) => [...m, { id: `a${m.length}`, role: "assistant", status: "streaming", createdAt: now(), parts: [] }]);
      const breaks = /break|fail/i.test(lastPrompt.current) && failures.current === 0;
      if (breaks) failures.current += 1;
      later(50, () => stream(breaks ? 6 : undefined));
    });
  };

  const settle = (text: string, done: boolean) => {
    later(600, () => {
      patch((m) => (done ? updateTool(m, "mail", { state: "done", endedAt: now() }) : m));
      patch((m) => finishMessage({ ...m, parts: [...m.parts, { type: "text", text }] }));
      setStatus("ready");
    });
  };

  return (
    <div className="h-[32rem] w-[44rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <Chat
        label="Simulated assistant"
        messages={messages}
        status={status}
        suggestions={["Summarize last month", "Summarize it and send the report", "Summarize it (this one breaks once)"]}
        onSend={(text) => {
          lastPrompt.current = text;
          setMessages((m) => [...m, { id: `u${m.length}`, role: "user", createdAt: now(), parts: [{ type: "text", text }] }]);
          reply();
        }}
        onStop={() => {
          cancelAll();
          patch((m) => finishMessage(m, "stopped"));
          setStatus("ready");
        }}
        onRetry={() => {
          // Drop the failed reply and ask again; this time it goes through.
          setMessages((m) => m.slice(0, -1));
          reply();
        }}
        onApprove={(id) => {
          patch((m) => updateTool(m, id, { state: "approved" }));
          settle("Sent to finance.", true);
        }}
        onDeny={(id) => {
          patch((m) => updateTool(m, id, { state: "denied" }));
          settle("Okay, I did not send it.", false);
        }}
      />
    </div>
  );
}
