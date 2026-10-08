import { Sparkline } from "@rdloom/react";

// Fixed, repeatable series so the preview never changes between renders.
const noise = (i: number, k: number) => Math.sin(i * 12.9898 + k * 78.233) * 0.5 + Math.sin(i * 4.1 + k) * 0.5;

const data = Array.from({ length: 40 }, (_, i) => Math.round((60 + i * 0.9 + noise(i, 5) * 6) * 10) / 10);

// You choose the size in pixels, or pass responsive to fill the parent. Small ones sit in text, large ones stand on their own.
export default function SparklineSizesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-[36rem] max-w-full flex-col gap-5">
        {[
          { w: 96, h: 28 },
          { w: 240, h: 48 },
          { w: 576, h: 80 },
        ].map(({ w, h }) => (
          <figure key={w} className="flex items-center gap-4">
            <figcaption className="w-24 shrink-0 text-xs tabular-nums text-[var(--rd-color-text-muted)]">
              {w} × {h}
            </figcaption>
            <Sparkline type="area" width={w} height={h} data={data} className="max-w-full" />
          </figure>
        ))}
      </div>
    </div>
  );
}
