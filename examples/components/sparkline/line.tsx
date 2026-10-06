import { Sparkline } from "@rdloom/react";

// Give it a label when the picture carries information the page doesn't say in words.
export default function SparklineLineExample() {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-sm text-[var(--rd-color-text-muted)]">Revenue, last 10 weeks</span>
      <Sparkline width={220} height={64} data={[21, 24, 22, 30, 28, 35, 41, 38, 44, 48]} label="Revenue, last 10 weeks: from 21K to 48K" />
    </div>
  );
}
