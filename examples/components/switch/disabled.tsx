import { Switch } from "@rdloom/react";

export default function SwitchDisabledExample() {
  return (
    <div className="flex flex-col gap-3">
      <Switch isDisabled>Auto-update</Switch>
      <Switch isDisabled defaultSelected>
        Backups
      </Switch>
    </div>
  );
}
