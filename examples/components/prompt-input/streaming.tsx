import { useState } from "react";
import { PromptInput } from "@rdloom/react";

// While a reply is on its way the button becomes Stop and sending is blocked.
export default function PromptInputStreamingExample() {
  const [streaming, setStreaming] = useState(true);
  return (
    <div className="w-[32rem] max-w-full">
      <PromptInput isStreaming={streaming} onStop={() => setStreaming(false)} onSubmit={() => setStreaming(true)} />
    </div>
  );
}
