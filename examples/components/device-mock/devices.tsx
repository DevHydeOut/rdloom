import { DeviceMock } from "@rdloom/react";

const screen = (title: string) => (
  <div className="flex size-full min-h-24 flex-col items-center justify-center gap-1 p-3 text-center">
    <h3 className="m-0 text-sm font-semibold">{title}</h3>
    <p className="m-0 text-xs text-[var(--rd-color-text-muted)]">Sample screen</p>
  </div>
);

export default function DeviceMockDevicesExample() {
  return (
    <div className="flex w-full flex-wrap items-end justify-center gap-6">
      <DeviceMock device="laptop" label="Laptop preview" className="max-w-[20rem]">
        {screen("Laptop")}
      </DeviceMock>
      <DeviceMock device="desktop" tone="light" label="Desktop preview" className="max-w-[20rem]">
        {screen("Desktop")}
      </DeviceMock>
      <DeviceMock device="browser" label="Browser preview" className="max-w-[20rem]">
        {screen("Browser")}
      </DeviceMock>
      <DeviceMock device="watch" label="Watch preview" className="max-w-[7rem]">
        {screen("Watch")}
      </DeviceMock>
    </div>
  );
}
