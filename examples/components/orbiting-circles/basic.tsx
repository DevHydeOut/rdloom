import { OrbitingCircles, SparkleIcon, HomeIcon, ChartIcon, BellIcon, SettingsIcon } from "@rdloom/react";

const chip = "flex size-9 items-center justify-center rounded-full border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)]";

export default function OrbitingCirclesBasicExample() {
  return (
    <div className="flex w-full justify-center py-4">
      <OrbitingCircles
        radius={110}
        iconSize={36}
        center={
          <span className="flex size-14 items-center justify-center rounded-full bg-[var(--rd-color-action-primary)] text-[var(--rd-color-action-on-primary)]">
            <SparkleIcon className="size-6" />
          </span>
        }
      >
        <span className={chip}><HomeIcon /></span>
        <span className={chip}><ChartIcon /></span>
        <span className={chip}><BellIcon /></span>
        <span className={chip}><SettingsIcon /></span>
      </OrbitingCircles>
    </div>
  );
}
