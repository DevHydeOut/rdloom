import { Text3dFlip } from "@rdloom/react";

export default function Text3dFlipOnViewExample() {
  return (
    <div className="flex w-full justify-center py-6">
      <Text3dFlip trigger="view" className="text-4xl font-bold">
        Flips once on arrival
      </Text3dFlip>
    </div>
  );
}
