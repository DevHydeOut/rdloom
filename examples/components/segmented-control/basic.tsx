import { SegmentedControl, SegmentedControlItem } from "@rdloom/react";

export default function SegmentedControlBasicExample() {
  return (
    <SegmentedControl label="View" defaultSelectedKey="list">
      <SegmentedControlItem id="list">List</SegmentedControlItem>
      <SegmentedControlItem id="board">Board</SegmentedControlItem>
      <SegmentedControlItem id="calendar">Calendar</SegmentedControlItem>
    </SegmentedControl>
  );
}
