import { Progress } from "@rdloom/react";

export default function ProgressVariantsExample() {
  return (
    <div className="flex w-80 max-w-full flex-col gap-4">
      <Progress label="Import finished" value={100} variant="success" />
      <Progress label="Storage used" value={92} variant="warning" valueLabel="9.2 of 10 GB" />
      <Progress label="Quota exceeded" value={100} variant="danger" size="sm" />
    </div>
  );
}
