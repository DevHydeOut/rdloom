import { Message, type ChatMessage } from "@rdloom/react";

const question: ChatMessage = { id: "1", role: "user", parts: [{ type: "text", text: "How do refunds work?" }] };

const answer: ChatMessage = {
  id: "2",
  role: "assistant",
  parts: [
    { type: "text", text: "Refunds are issued within **5 business days** [1]. You can ask for one:\n\n- from your order page\n- by replying to the receipt" },
    { type: "citation", id: "policy", title: "Refund policy", url: "https://example.com/policy", snippet: "Refunds are issued within 5 business days." },
  ],
};

export default function MessageTextExample() {
  return (
    <div className="flex w-[36rem] max-w-full flex-col gap-6">
      <Message message={question} />
      <Message message={answer} />
    </div>
  );
}
