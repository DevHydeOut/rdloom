import { TextHighlighter } from "@rdloom/react";

// The highlight is a background on inline text, so it wraps with the line.
export default function TextHighlighterInAParagraphExample() {
  return (
    <div className="flex w-full justify-center">
      <p className="max-w-md text-center text-base leading-relaxed">
        Every component ships with its own tests, and{" "}
        <TextHighlighter delay={0.2}>keyboard and screen reader behaviour is checked before release</TextHighlighter>, not after.
      </p>
    </div>
  );
}
