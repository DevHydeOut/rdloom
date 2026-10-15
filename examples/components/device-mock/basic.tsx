import { DeviceMock } from "@rdloom/react";

export default function DeviceMockBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <DeviceMock device="phone" label="Phone preview" className="max-w-[14rem]">
        <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center">
          <h3 className="m-0 text-base font-semibold">Good morning</h3>
          <p className="m-0 text-sm text-[var(--rd-color-text-muted)]">Three tasks are due today.</p>
        </div>
      </DeviceMock>
    </div>
  );
}
