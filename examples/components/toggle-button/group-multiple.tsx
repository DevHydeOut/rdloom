import { ToggleButton, ToggleButtonGroup } from "@rdloom/react";

export default function ToggleButtonGroupMultipleExample() {
  return (
    <ToggleButtonGroup label="Text style" selectionMode="multiple" defaultSelectedKeys={["bold"]}>
      <ToggleButton id="bold">Bold</ToggleButton>
      <ToggleButton id="italic">Italic</ToggleButton>
      <ToggleButton id="underline">Underline</ToggleButton>
    </ToggleButtonGroup>
  );
}
