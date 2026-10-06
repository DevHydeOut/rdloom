import { useEffect, useRef, useState } from "react";
import { Chat, GlobeIcon, ImageIcon, fileToAttachment, releaseAttachment, type ChatMessage, type PromptAttachment } from "@rdloom/react";

// A chat with the + menu, file previews and a microphone. Sent files become `file` parts of the message.
// Nothing here uploads anywhere: that is up to your onSend.
export default function ChatWithAttachmentsExample() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<PromptAttachment[]>([]);
  const [listening, setListening] = useState(false);
  const sent = useRef<PromptAttachment[]>([]);
  const latest = useRef(files);
  latest.current = files;
  useEffect(
    () => () => {
      latest.current.forEach(releaseAttachment);
      sent.current.forEach(releaseAttachment);
    },
    [],
  );

  return (
    <div className="h-[30rem] w-[44rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <Chat
        label="Assistant"
        placeholder="Ask anything"
        messages={messages}
        attachments={files}
        accept="image/*,.pdf,.txt"
        onAttach={(chosen) => setFiles((list) => [...list, ...chosen.map(fileToAttachment)])}
        onRemoveAttachment={(id) =>
          setFiles((list) => {
            list.filter((a) => a.id === id).forEach(releaseAttachment);
            return list.filter((a) => a.id !== id);
          })
        }
        actions={[
          { id: "image", label: "Create image", description: "Visualize anything", icon: <ImageIcon className="size-5" />, onSelect: () => {} },
          { id: "search", label: "Web search", description: "Find real-time news and info", icon: <GlobeIcon className="size-5" />, onSelect: () => {} },
        ]}
        onVoice={() => setListening((v) => !v)}
        isListening={listening}
        onSend={(text, attached = []) => {
          sent.current.push(...attached); // the message keeps showing the pictures, so their previews stay alive
          setFiles([]);
          setMessages((m) => [
            ...m,
            {
              id: `u${m.length}`,
              role: "user",
              parts: [
                ...attached.map((a) => ({ type: "file" as const, name: a.name, mediaType: a.mediaType, url: a.url, size: a.size })),
                ...(text ? [{ type: "text" as const, text }] : []),
              ],
            },
            { id: `a${m.length}`, role: "assistant", parts: [{ type: "text", text: "Got it. This demo doesn't call a model: you decide what happens in onSend." }] },
          ]);
        }}
      />
    </div>
  );
}
