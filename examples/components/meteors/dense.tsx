import { Meteors } from "@rdloom/react";

export default function MeteorsDenseExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative h-48 w-full max-w-md overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <Meteors count={36} angle={200} duration={4} />
        <div className="relative flex h-full items-center justify-center text-sm font-medium">Meteor shower</div>
      </div>
    </div>
  );
}
