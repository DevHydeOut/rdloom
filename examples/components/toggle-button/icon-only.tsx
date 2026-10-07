import { BellIcon, GlobeIcon, ImageIcon, ToggleButton, ToggleButtonGroup } from "@rdloom/react";

export default function ToggleButtonIconOnlyExample() {
  return (
    <ToggleButtonGroup label="Show in the feed" selectionMode="multiple" defaultSelectedKeys={["images"]}>
      <ToggleButton id="images" aria-label="Images">
        <ImageIcon />
      </ToggleButton>
      <ToggleButton id="links" aria-label="Links">
        <GlobeIcon />
      </ToggleButton>
      <ToggleButton id="alerts" aria-label="Alerts">
        <BellIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
