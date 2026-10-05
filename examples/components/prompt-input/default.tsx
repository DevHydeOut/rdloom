import { useState } from "react";
import { PromptInput } from "@rdloom/react";

export default function PromptInputExample() {
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div className="flex w-[32rem] max-w-full flex-col gap-3">
      <PromptInput onSubmit={(text) => setSent((s) => [...s, text])} />
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
