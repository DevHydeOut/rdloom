import { Sparkline } from "@rdloom/react";

const data = [14, 18, 15, 22, 20, 27, 25, 33, 30, 38];

// You choose the size in pixels. Small ones sit in text, large ones stand on their own.
export default function SparklineSizesExample() {
  return (
    <div className="flex items-end gap-8">
      {[
        { w: 56, h: 20 },
        { w: 96, h: 32 },
        { w: 160, h: 56 },
        { w: 240, h: 88 },
      ].map(({ w, h }) => (
        <figure key={w} className="flex flex-col items-center gap-2">
          <Sparkline type="area" width={w} height={h} data={data} />
          <figcaption className="text-xs text-[var(--rd-color-text-muted)]">
            {w} × {h}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
