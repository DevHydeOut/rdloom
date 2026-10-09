import { AuroraText } from "@rdloom/react";

export default function AuroraTextPausedExample() {
  return (
    <div className="flex w-full justify-center py-6">
      <AuroraText isPaused className="text-5xl font-bold">
        Held in place
      </AuroraText>
    </div>
  );
}
