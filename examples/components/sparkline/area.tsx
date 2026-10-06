import { Sparkline } from "@rdloom/react";

export default function SparklineAreaExample() {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-sm text-[var(--rd-color-text-muted)]">Daily sign-ups</span>
      <Sparkline type="area" width={220} height={64} data={[12, 14, 11, 18, 17, 22, 21, 29, 26, 34]} label="Daily sign-ups: from 12 to 34" />
    </div>
  );
}
