import { Progress } from "@rdloom/react";

export default function ProgressIndeterminateExample() {
  return (
    <div className="w-80 max-w-full">
      <Progress label="Preparing your export" isIndeterminate />
    </div>
  );
}
