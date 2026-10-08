import { ToggleGroup, ToggleGroupItem } from "@rdloom/react";

export default function ToggleGroupVerticalExample() {
  return (
    <div className="flex w-full justify-center">
      <ToggleGroup aria-label="Density" orientation="vertical" defaultSelectedKeys={["comfortable"]} disallowEmptySelection>
        <ToggleGroupItem id="compact">Compact</ToggleGroupItem>
        <ToggleGroupItem id="comfortable">Comfortable</ToggleGroupItem>
        <ToggleGroupItem id="spacious">Spacious</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
