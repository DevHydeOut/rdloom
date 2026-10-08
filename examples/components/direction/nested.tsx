import { Direction, TextField, useDirection } from "@rdloom/react";

function Current() {
  const { direction } = useDirection();
  return <p className="text-sm text-[var(--rd-color-text-muted)]">Direction here: {direction}</p>;
}

export default function DirectionNestedExample() {
  return (
    <div className="flex w-full justify-center">
      <Direction direction="rtl" lang="ar" className="flex w-full max-w-sm flex-col gap-4 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] p-4">
        <Current />
        <TextField label="الاسم" />
        <Direction direction="ltr" lang="en" className="flex flex-col gap-2 border-s-2 border-[var(--rd-color-border-strong)] ps-3">
          <Current />
          <TextField label="Email address" description="Addresses are always written left to right." />
        </Direction>
      </Direction>
    </div>
  );
}
