import { Message, type ChatMessage } from "@rdloom/react";

const failed: ChatMessage = { id: "1", role: "assistant", status: "error", parts: [{ type: "text", text: "I started looking, but" }] };
const stopped: ChatMessage = { id: "2", role: "assistant", status: "stopped", parts: [{ type: "text", text: "Here is the first part of the answer" }] };

export default function MessageErrorExample() {
  return (
    <div className="flex w-[36rem] max-w-full flex-col gap-6">
      <Message message={failed} onRetry={() => {}} />
      <Message message={stopped} />
    </div>
  );
}
