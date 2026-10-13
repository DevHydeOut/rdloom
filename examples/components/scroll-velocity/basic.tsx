import { ScrollVelocity } from "@rdloom/react";

export default function ScrollVelocityBasicExample() {
  return (
    <div className="w-full overflow-hidden py-6">
      <ScrollVelocity rows={["Scroll faster", "The words follow you"]} className="text-5xl font-bold" />
    </div>
  );
}
