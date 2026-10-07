import { Collapsible } from "@rdloom/react";

export default function CollapsibleWithSummaryLineExample() {
  return (
    <div className="w-full max-w-md">
      <Collapsible title="Changed files" summary="3 files, 42 lines added" defaultExpanded>
        <ul className="list-disc ps-5">
          <li>src/invoice.ts</li>
          <li>src/totals.ts</li>
          <li>test/totals.test.ts</li>
        </ul>
      </Collapsible>
    </div>
  );
}
