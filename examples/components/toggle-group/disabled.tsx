import { ToggleGroup, ToggleGroupItem } from "@rdloom/react";

export default function ToggleGroupDisabledExample() {
  return (
    <div className="flex w-full justify-center">
      <ToggleGroup aria-label="Layout (locked by your plan)" isDisabled defaultSelectedKeys={["grid"]}>
        <ToggleGroupItem id="list">List</ToggleGroupItem>
        <ToggleGroupItem id="grid">Grid</ToggleGroupItem>
        <ToggleGroupItem id="board">Board</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
