import { RevealButton } from "@rdloom/react";

export default function RevealButtonVariantsExample() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <RevealButton>Continue</RevealButton>
      <RevealButton variant="secondary">View all</RevealButton>
      <RevealButton variant="ghost">Next step</RevealButton>
    </div>
  );
}
