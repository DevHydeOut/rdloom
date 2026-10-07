import { ToggleButton, ToggleButtonGroup } from "@rdloom/react";

export default function ToggleButtonOutlineExample() {
  return (
    <div className="flex flex-col items-start gap-4">
      <ToggleButton variant="outline">Mute</ToggleButton>
      <ToggleButtonGroup label="Alignment" variant="outline" defaultSelectedKeys={["left"]}>
        <ToggleButton id="left">Left</ToggleButton>
        <ToggleButton id="center">Center</ToggleButton>
        <ToggleButton id="right">Right</ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}
