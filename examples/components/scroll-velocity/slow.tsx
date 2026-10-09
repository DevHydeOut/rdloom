import { ScrollVelocity } from "@rdloom/react";

export default function ScrollVelocitySlowExample() {
  return (
    <div className="w-full overflow-hidden py-6">
      <ScrollVelocity rows={["Gentle drift", "Barely moving"]} speed={25} velocityFactor={0.15} className="text-4xl font-semibold" />
    </div>
  );
}
