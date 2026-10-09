import { BentoCard, BentoGrid, GlobeIcon, SparkleIcon } from "@rdloom/react";

const glow = (angle: number) => (
  <div
    className="size-full opacity-40"
    style={{ background: `linear-gradient(${angle}deg, color-mix(in srgb, var(--rd-color-action-primary) 30%, transparent), transparent 60%)` }}
  />
);

export default function BentoGridWithBackgroundExample() {
  return (
    <div className="flex w-full justify-center">
      <BentoGrid label="Highlights" className="max-w-2xl">
        <BentoCard colSpan={2} background={glow(135)} icon={<SparkleIcon />} title="Polish by default" description="Spacing, focus rings and states are already done." />
        <BentoCard background={glow(225)} icon={<GlobeIcon />} title="Any language" description="Right-to-left layouts work without extra code." />
      </BentoGrid>
    </div>
  );
}
