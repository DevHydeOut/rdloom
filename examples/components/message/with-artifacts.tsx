import { Message, type ChatMessage } from "@rdloom/react";

const message: ChatMessage = {
  id: "1",
  role: "assistant",
  parts: [
    { type: "text", text: "Here is last month's revenue by week, and the same numbers as a table." },
    {
      type: "artifact",
      kind: "chart",
      title: "Revenue by week, February",
      summary: "Revenue rose each week, from $9.2K to $15.8K.",
      data: { labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"], series: [{ name: "Revenue", values: [9200, 11400, 13100, 15800] }], unit: "$" },
    },
    {
      type: "artifact",
      kind: "table",
      title: "Revenue by week",
      data: {
        columns: ["Week", "Orders", "Revenue ($)"],
        rows: [["Wk 1", 310, 9200], ["Wk 2", 385, 11400], ["Wk 3", 440, 13100], ["Wk 4", 512, 15800]],
      },
    },
  ],
};

export default function MessageWithArtifactsExample() {
  return (
    <div className="w-[40rem] max-w-full">
      <Message message={message} />
    </div>
  );
}
