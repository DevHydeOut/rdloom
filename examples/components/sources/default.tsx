import { Sources } from "@rdloom/react";

export default function SourcesExample() {
  return (
    <div className="w-[30rem] max-w-full">
      <Sources
        sources={[
          { type: "citation", id: "1", title: "Quarterly report, Q3", url: "https://example.com/reports/q3", snippet: "Revenue grew 12% over the previous quarter, led by annual plans." },
          { type: "citation", id: "2", title: "Billing system export", snippet: "Internal data, March to June." },
          { type: "citation", id: "3", title: "Pricing page", url: "https://www.example.org/pricing" },
        ]}
      />
    </div>
  );
}
