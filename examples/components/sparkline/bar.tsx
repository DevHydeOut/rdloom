import { Sparkline } from "@rdloom/react";

export default function SparklineBarExample() {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-sm text-[var(--rd-color-text-muted)]">Orders per day</span>
      <Sparkline type="bar" color="success" width={220} height={64} data={[3, 5, 2, 8, 6, 9, 7, 11, 9, 12]} label="Orders per day: from 3 to 12" />
    </div>
  );
}
