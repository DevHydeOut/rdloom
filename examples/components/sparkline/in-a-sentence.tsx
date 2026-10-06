import { Sparkline } from "@rdloom/react";

export default function SparklineInASentenceExample() {
  return (
    <p className="flex items-center gap-2 text-sm">
      Traffic is up 18% this week
      <Sparkline data={[40, 42, 39, 45, 50, 52, 58]} width={64} height={20} />
    </p>
  );
}
