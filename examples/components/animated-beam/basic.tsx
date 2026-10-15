import { forwardRef, useRef, type ReactNode } from "react";
import { AnimatedBeam, ChartIcon, CreditCardIcon, InboxIcon, SparkleIcon, UsersIcon, FileIcon } from "@rdloom/react";

const Node = forwardRef<HTMLDivElement, { children: ReactNode; big?: boolean }>(function Node({ children, big }, ref) {
  return (
    <div
      ref={ref}
      className={`relative z-10 flex items-center justify-center rounded-full border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] [box-shadow:var(--rd-elevation-raised)] ${
        big ? "size-16" : "size-12"
      }`}
    >
      {children}
    </div>
  );
});

// Several sources feed one hub, and the hub feeds two places. Each beam is a decorative line between two real elements.
export default function AnimatedBeamBasicExample() {
  const container = useRef<HTMLDivElement>(null);
  const orders = useRef<HTMLDivElement>(null);
  const customers = useRef<HTMLDivElement>(null);
  const invoices = useRef<HTMLDivElement>(null);
  const hub = useRef<HTMLDivElement>(null);
  const reports = useRef<HTMLDivElement>(null);
  const inbox = useRef<HTMLDivElement>(null);
  return (
    <div className="flex w-full justify-center">
      <div ref={container} className="relative flex h-80 w-full max-w-2xl items-center justify-between px-6">
        <div className="flex flex-col gap-8">
          <Node ref={orders}>
            <FileIcon className="size-5" />
          </Node>
          <Node ref={customers}>
            <UsersIcon className="size-5" />
          </Node>
          <Node ref={invoices}>
            <CreditCardIcon className="size-5" />
          </Node>
        </div>
        <Node ref={hub} big>
          <SparkleIcon className="size-7" />
        </Node>
        <div className="flex flex-col gap-16">
          <Node ref={reports}>
            <ChartIcon className="size-5" />
          </Node>
          <Node ref={inbox}>
            <InboxIcon className="size-5" />
          </Node>
        </div>
        <AnimatedBeam containerRef={container} fromRef={orders} toRef={hub} curvature={-40} />
        <AnimatedBeam containerRef={container} fromRef={customers} toRef={hub} duration={5} />
        <AnimatedBeam containerRef={container} fromRef={invoices} toRef={hub} curvature={40} duration={6} />
        <AnimatedBeam containerRef={container} fromRef={hub} toRef={reports} curvature={-30} duration={7} reverse />
        <AnimatedBeam containerRef={container} fromRef={hub} toRef={inbox} curvature={30} duration={6.5} reverse />
      </div>
    </div>
  );
}
