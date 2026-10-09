import { TextHighlighter } from "@rdloom/react";

// A light marker keeps the text readable. Check contrast if you pick your own colour.
export default function TextHighlighterCustomColorExample() {
  return (
    <div className="flex w-full flex-col items-center gap-3 text-xl font-semibold">
      <TextHighlighter color="rgb(253 224 71 / 0.55)">A yellow marker</TextHighlighter>
      <TextHighlighter color="rgb(134 239 172 / 0.5)" whenInView={false} duration={1.2}>
        A green one, sweeping on load
      </TextHighlighter>
    </div>
  );
}
