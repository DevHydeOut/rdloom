import { Progress } from "@rdloom/react";

export default function ProgressBasicExample() {
  return (
    <div className="w-80 max-w-full">
      <Progress label="Uploading report.pdf" value={64} />
    </div>
  );
}
