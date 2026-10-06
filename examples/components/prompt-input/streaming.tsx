import { useState } from "react";
import { PromptInput } from "@rdloom/react";

// While a reply is on its way the Send button becomes Stop and sending is blocked.
export default function PromptInputStreamingExample() {
  const [streaming, setStreaming] = useState(true);
  return (
    <div className="w-[36rem] max-w-full">
      <PromptInput placeholder="Ask anything" isStreaming={streaming} onStop={() => setStreaming(false)} onSubmit={() => setStreaming(true)} />
    </div>
  );
}
