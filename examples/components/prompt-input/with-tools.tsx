import { useState } from "react";
import { GlobeIcon, ImageIcon, PromptInput, SparkleIcon } from "@rdloom/react";

// The + menu can hold your own tools next to "Add photos & files". endContent puts a control of yours on the
// right, and onVoice adds the microphone button.
export default function PromptInputWithToolsExample() {
  const [listening, setListening] = useState(false);
  const [think, setThink] = useState(false);
  const [note, setNote] = useState("Nothing chosen yet.");

  return (
    <div className="flex w-[36rem] max-w-full flex-col gap-3">
      <PromptInput
        placeholder="Ask anything"
        onAttach={() => setNote("You chose Add photos & files.")}
        actions={[
          { id: "image", label: "Create image", description: "Visualize anything", icon: <ImageIcon className="size-5" />, onSelect: () => setNote("You chose Create image.") },
          { id: "search", label: "Web search", description: "Find real-time news and info", icon: <GlobeIcon className="size-5" />, onSelect: () => setNote("You chose Web search.") },
        ]}
        onVoice={() => setListening((v) => !v)}
        isListening={listening}
        endContent={
          <button
            type="button"
            aria-pressed={think}
            onClick={() => setThink((v) => !v)}
            className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-[var(--rd-color-text-muted)] outline-none hover:bg-[var(--rd-color-surface-selected)] hover:text-[var(--rd-color-text-default)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] aria-pressed:bg-[var(--rd-color-surface-selected)] aria-pressed:text-[var(--rd-color-action-primary)]"
          >
            <SparkleIcon className="size-4" />
            Think
          </button>
        }
        onSubmit={(text) => setNote(`You sent: ${text}${think ? " (thinking on)" : ""}`)}
      />
      <p role="status" className="text-sm text-[var(--rd-color-text-muted)]">
        {note}
        {listening && " Listening…"}
      </p>
    </div>
  );
}
