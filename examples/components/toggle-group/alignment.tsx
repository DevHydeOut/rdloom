import { MenuIcon, ToggleGroup, ToggleGroupItem } from "@rdloom/react";

export default function ToggleGroupAlignmentExample() {
  return (
    <div className="flex w-full justify-center">
      <ToggleGroup aria-label="Text alignment" selectionMode="single" defaultSelectedKeys={["start"]} disallowEmptySelection variant="ghost">
        <ToggleGroupItem id="start" aria-label="Align to start">
          <MenuIcon />
        </ToggleGroupItem>
        <ToggleGroupItem id="center" aria-label="Align to center">
          <MenuIcon className="size-4 shrink-0 scale-x-75" />
        </ToggleGroupItem>
        <ToggleGroupItem id="end" aria-label="Align to end">
          <MenuIcon className="size-4 shrink-0 -scale-x-100" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
