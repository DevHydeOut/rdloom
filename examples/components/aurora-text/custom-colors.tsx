import { AuroraText } from "@rdloom/react";

export default function AuroraTextCustomColorsExample() {
  return (
    <div className="flex w-full justify-center py-6">
      <AuroraText colors={["#1d4ed8", "#7c3aed", "#be185d"]} speed={0.6} className="text-5xl font-bold">
        Deep colours, slow drift
      </AuroraText>
    </div>
  );
}
