import { Separator } from "@rdloom/react";

export default function SeparatorBasicExample() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3 text-sm">
      <p>Account settings</p>
      <Separator />
      <p>Notification settings</p>
    </div>
  );
}
