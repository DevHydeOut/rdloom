import { useRef } from "react";
import { AnimatedBeam } from "@rdloom/react";

export default function AnimatedBeamCurvedExample() {
  const container = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  const c = useRef<HTMLDivElement>(null);
  const box = "relative z-10 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-4 py-3 text-sm";
  return (
    <div className="flex w-full justify-center">
      <div ref={container} className="relative flex w-full max-w-2xl items-center justify-between px-6 py-14">
        <div ref={a} className={box}>Form</div>
        <div ref={b} className={box}>Queue</div>
        <div ref={c} className={box}>Report</div>
        <AnimatedBeam containerRef={container} fromRef={a} toRef={b} curvature={-40} />
        <AnimatedBeam containerRef={container} fromRef={b} toRef={c} curvature={40} reverse duration={4} />
      </div>
    </div>
  );
}
