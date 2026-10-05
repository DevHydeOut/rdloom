import { SegmentedControl, SegmentedControlItem } from "@rdloom/react";

export default function SegmentedControlSizesExample() {
  return (
    <div className="flex flex-col items-start gap-3">
      <SegmentedControl label="Density, small" size="sm" defaultSelectedKey="compact">
        <SegmentedControlItem id="compact">Compact</SegmentedControlItem>
        <SegmentedControlItem id="comfortable">Comfortable</SegmentedControlItem>
      </SegmentedControl>
      <SegmentedControl label="Density, medium" size="md" defaultSelectedKey="comfortable">
        <SegmentedControlItem id="compact">Compact</SegmentedControlItem>
        <SegmentedControlItem id="comfortable">Comfortable</SegmentedControlItem>
      </SegmentedControl>
    </div>
  );
}
