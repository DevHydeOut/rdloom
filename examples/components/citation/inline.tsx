import { Citation, Sources, type CitationPart } from "@rdloom/react";

const sources: CitationPart[] = [
  { type: "citation", id: "a", title: "Accessibility guidelines", url: "https://example.com/wcag" },
  { type: "citation", id: "b", title: "Keyboard patterns", url: "https://example.com/patterns" },
];

export default function CitationInlineExample() {
  return (
    <div className="flex w-[30rem] max-w-full flex-col gap-4">
      <p className="text-sm leading-relaxed">
        Every control must work with a keyboard
        <Citation index={1} source={sources[0]} />
        and show where focus is
        <Citation index={2} source={sources[1]} />.
      </p>
      <Sources sources={sources} />
    </div>
  );
}
