import { ToggleGroup, ToggleGroupItem } from "@rdloom/react";

export default function ToggleGroupFormattingExample() {
  return (
    <div className="flex w-full justify-center">
      <ToggleGroup aria-label="Text formatting" selectionMode="multiple" defaultSelectedKeys={["bold"]}>
        <ToggleGroupItem id="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem id="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem id="underline">Underline</ToggleGroupItem>
        <ToggleGroupItem id="strike">Strikethrough</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
