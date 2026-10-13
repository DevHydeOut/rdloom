import { ScrollVelocity } from "@rdloom/react";

export default function ScrollVelocitySingleRowExample() {
  return (
    <div className="w-full overflow-hidden py-6">
      <ScrollVelocity rows={["Design systems that move"]} showPauseButton={false} className="text-6xl font-black" />
    </div>
  );
}
