import { Response, Sources, type CitationPart } from "@rdloom/react";

const sources: CitationPart[] = [
  { type: "citation", id: "ops", title: "Operations handbook", url: "https://example.com/handbook", snippet: "Refunds are issued within 5 business days." },
  { type: "citation", id: "policy", title: "Refund policy", url: "https://example.com/policy" },
];

// [1] and [2] in the text become markers that jump to the matching entry in Sources.
export default function ResponseWithCitationsExample() {
  return (
    <div className="flex w-[34rem] max-w-full flex-col gap-4">
      <Response citations={sources}>
        Refunds go out within 5 business days [1], and only for orders placed in the last 30 days [2].
      </Response>
      <Sources sources={sources} />
    </div>
  );
}
