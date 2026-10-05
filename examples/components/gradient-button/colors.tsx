import { GradientButton } from "@rdloom/react";

export default function GradientButtonColorsExample() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <GradientButton colors={["#6366f1", "#06b6d4", "#22c55e"]}>Cool</GradientButton>
      <GradientButton colors={["#f97316", "#ef4444", "#a855f7"]} duration={2}>
        Warm and quick
      </GradientButton>
    </div>
  );
}
