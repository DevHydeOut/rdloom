import { useEffect, useRef, useState } from "react";
import { PromptInput, fileToAttachment, releaseAttachment, type PromptAttachment } from "@rdloom/react";

// onAttach turns on "Add photos & files" in the + menu. You own the list: add to it, remove from it, and clear it
// when the message is sent. fileToAttachment makes a small preview for pictures; releaseAttachment frees it.
export default function PromptInputWithAttachmentsExample() {
  const [files, setFiles] = useState<PromptAttachment[]>([]);
  const [sent, setSent] = useState<string[]>([]);
  const latest = useRef(files);
  latest.current = files;
  useEffect(() => () => latest.current.forEach(releaseAttachment), []);

  return (
    <div className="flex w-[36rem] max-w-full flex-col gap-3">
      <PromptInput
        placeholder="Ask anything"
        accept="image/*,.pdf,.txt"
        attachments={files}
        onAttach={(chosen) => setFiles((list) => [...list, ...chosen.map(fileToAttachment)])}
        onRemoveAttachment={(id) =>
          setFiles((list) => {
            list.filter((a) => a.id === id).forEach(releaseAttachment);
            return list.filter((a) => a.id !== id);
          })
        }
        onSubmit={(text, attached) => {
          setSent((s) => [...s, `${text || "(no text)"} + ${attached.length} file${attached.length === 1 ? "" : "s"}`]);
          setFiles([]); // the files went with the message
        }}
      />
      {sent.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {sent.map((line, i) => (
            <li key={i}>You sent: {line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
