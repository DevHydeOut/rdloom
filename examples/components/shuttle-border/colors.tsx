import { ShuttleBorder } from "@rdloom/react";

export default function ShuttleBorderColorsExample() {
  const card = "w-56 rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-4 text-sm";
  return (
    <div className="flex flex-wrap gap-4">
      <ShuttleBorder className={card} color="var(--rd-color-feedback-success)" duration={5}>
        Healthy
      </ShuttleBorder>
      <ShuttleBorder className={card} color="var(--rd-color-feedback-info)" borderWidth={2.5}>
        Thicker light
      </ShuttleBorder>
    </div>
  );
}
