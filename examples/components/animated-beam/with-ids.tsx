import { useRef } from "react";
import { AnimatedBeam } from "@rdloom/react";

export default function AnimatedBeamWithIdsExample() {
  const container = useRef<HTMLDivElement>(null);
  const box = "relative z-10 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-4 py-3 text-sm";
  return (
    <div className="flex w-full justify-center">
      <div ref={container} className="relative flex w-full max-w-2xl items-center justify-between px-6 py-10">
        <div id="beam-source" className={box}>Source</div>
        <div id="beam-target" className={box}>Target</div>
        <AnimatedBeam containerRef={container} fromId="beam-source" toId="beam-target" pathWidth={3} />
      </div>
    </div>
  );
}
