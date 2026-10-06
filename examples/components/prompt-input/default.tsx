import { useState } from "react";
import { PromptInput } from "@rdloom/react";

// The simplest form: just a box and a Send button. Add the other buttons by passing the props for them.
export default function PromptInputExample() {
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div className="flex w-[36rem] max-w-full flex-col gap-3">
      <PromptInput placeholder="Ask anything" onSubmit={(text) => setSent((s) => [...s, text])} />
      {sent.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {sent.map((text, i) => (
            <li key={i}>You sent: {text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
