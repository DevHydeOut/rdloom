import { BentoCard, BentoGrid, ChartIcon, SettingsIcon, SparkleIcon, UsersIcon } from "@rdloom/react";

export default function BentoGridBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <BentoGrid label="Features" className="max-w-2xl">
        <BentoCard
          colSpan={2}
          icon={<SparkleIcon />}
          title="Components that ship ready"
          description="Each one is built on React Aria, so keyboard and screen reader support is there from the first render."
        />
        <BentoCard icon={<UsersIcon />} title="Made for teams" description="Shared tokens keep every screen consistent." />
        <BentoCard icon={<ChartIcon />} title="Readable data" description="Tables and charts with real text behind them." />
        <BentoCard colSpan={2} icon={<SettingsIcon />} title="Yours to change" description="The source is copied into your project, so you can edit it." />
      </BentoGrid>
    </div>
  );
}
