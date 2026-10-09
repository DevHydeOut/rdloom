import { useRef } from "react";
import { AnimatedBeam } from "@rdloom/react";

export default function AnimatedBeamBasicExample() {
  const container = useRef<HTMLDivElement>(null);
  const from = useRef<HTMLDivElement>(null);
  const to = useRef<HTMLDivElement>(null);
  return (
    <div className="flex w-full justify-center">
      <div ref={container} className="relative flex w-full max-w-md items-center justify-between px-6 py-10">
        <div ref={from} className="relative z-10 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-4 py-3 text-sm">
          Orders
        </div>
        <div ref={to} className="relative z-10 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-4 py-3 text-sm">
          Warehouse
        </div>
        <AnimatedBeam containerRef={container} fromRef={from} toRef={to} />
      </div>
    </div>
  );
}
