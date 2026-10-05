import { PulseButton } from "@rdloom/react";

export default function PulseButtonCustomColorExample() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <PulseButton color="var(--rd-color-feedback-success)" variant="secondary">
        Go live
      </PulseButton>
      <PulseButton color="var(--rd-color-feedback-danger)" variant="danger" duration={1.6}>
        Stop recording
      </PulseButton>
    </div>
  );
}
