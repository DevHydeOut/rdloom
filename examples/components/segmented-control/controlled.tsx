import { useState } from "react";
import { SegmentedControl, SegmentedControlItem } from "@rdloom/react";

export default function SegmentedControlControlledExample() {
  const [billing, setBilling] = useState<string>("monthly");
  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <SegmentedControl label="Billing period" selectedKey={billing} onChange={(key) => setBilling(String(key))}>
        <SegmentedControlItem id="monthly">Monthly</SegmentedControlItem>
        <SegmentedControlItem id="yearly">Yearly</SegmentedControlItem>
      </SegmentedControl>
      <p aria-live="polite">{billing === "yearly" ? "$190 a year, two months free." : "$19 a month."}</p>
    </div>
  );
}
