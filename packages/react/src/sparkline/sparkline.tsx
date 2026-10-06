import { forwardRef, type SVGAttributes } from "react";
import { sparklineDefaults, type SparklineSpecProps } from "../generated/sparkline.types";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface SparklineProps
  extends SparklineSpecProps,
    Omit<SVGAttributes<SVGSVGElement>, keyof SparklineSpecProps | "children"> {}

const colors: Record<NonNullable<SparklineSpecProps["color"]>, string> = {
  primary: "var(--rd-color-chart-1)",
  success: "var(--rd-color-feedback-success)",
  danger: "var(--rd-color-feedback-danger)",
  muted: "var(--rd-color-text-muted)",
};

const PAD = 2;
const round = (n: number) => Math.round(n * 100) / 100;

export const Sparkline = forwardRef<SVGSVGElement, SparklineProps>(function Sparkline(
  {
    data,
    type = sparklineDefaults.type,
    label,
    width = sparklineDefaults.width,
    height = sparklineDefaults.height,
    color = sparklineDefaults.color,
    showLast = sparklineDefaults.showLast,
    ...rest
  },
  ref,
) {
  const values = (data ?? []).filter((v) => typeof v === "number" && Number.isFinite(v));
  const stroke = colors[color];
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };

  let shapes: React.ReactNode = null;
  if (values.length > 0 && type === "bar") {
    const lo = Math.min(0, ...values);
    const hi = Math.max(0, ...values);
    const range = hi - lo || 1;
    const inner = height - PAD * 2;
    const y = (v: number) => PAD + ((hi - v) / range) * inner;
    const slot = (width - PAD * 2) / values.length;
    const barWidth = Math.max(1, slot * 0.7);
    shapes = values.map((v, i) => {
      const top = Math.min(y(v), y(0));
      const barHeight = Math.max(1, Math.abs(y(v) - y(0)));
      return (
        <rect
          key={i}
          x={round(PAD + i * slot + (slot - barWidth) / 2)}
          y={round(top)}
          width={round(barWidth)}
          height={round(barHeight)}
          rx={Math.min(1.5, barWidth / 2)}
          fill={stroke}
        />
      );
    });
  } else if (values.length > 0) {
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const inner = height - PAD * 2;
    const x = (i: number) => (values.length === 1 ? width / 2 : PAD + (i * (width - PAD * 2)) / (values.length - 1));
    // Flat data draws a centered line.
    const y = (v: number) => (hi === lo ? height / 2 : PAD + ((hi - v) / (hi - lo)) * inner);
    const points = values.map((v, i) => `${round(x(i))},${round(y(v))}`);
    const last = values.length - 1;
    shapes = (
      <>
        {values.length > 1 && (
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke={stroke}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {(showLast || values.length === 1) && <circle cx={round(x(last))} cy={round(y(values[last]))} r={2} fill={stroke} />}
      </>
    );
  }

  return (
    <svg
      focusable="false"
      {...rest}
      {...a11y}
      ref={ref}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      data-type={type}
    >
      {shapes}
    </svg>
  );
});
