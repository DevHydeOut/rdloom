import { Switch } from "@rdloom/react";

export default function SwitchSizesExample() {
  return (
    <div className="flex flex-col gap-3">
      <Switch size="sm">Compact mode</Switch>
      <Switch size="md">Dark mode</Switch>
    </div>
  );
}
