import { Sparkline } from "@rdloom/react";

// Rings mark the highest and lowest points; the dashed line is the average.
export default function SparklineWithExtremesExample() {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-sm text-[var(--rd-color-text-muted)]">Response time, last 24 hours</span>
      <Sparkline
        width={260}
        height={72}
        showExtremes
        showAverage
        data={[320, 280, 300, 410, 520, 380, 290, 260, 340, 610, 450, 330, 300, 270, 310, 290]}
        label="Response time, last 24 hours: lowest 260 ms, highest 610 ms, average about 360 ms"
      />
    </div>
  );
}
