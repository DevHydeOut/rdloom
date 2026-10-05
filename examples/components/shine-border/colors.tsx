import { ShineBorder } from "@rdloom/react";

export default function ShineBorderColorsExample() {
  return (
    <ShineBorder
      className="w-72 rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-5"
      colors={["#f97316", "#ec4899", "#8b5cf6"]}
      duration={5}
      borderWidth={2}
    >
      <p className="text-sm">Your own colours, speed and thickness.</p>
    </ShineBorder>
  );
}
