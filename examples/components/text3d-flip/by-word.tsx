import { Text3dFlip } from "@rdloom/react";

export default function Text3dFlipByWordExample() {
  return (
    <div className="flex w-full justify-center py-6">
      <Text3dFlip by="word" stagger={0.12} className="text-3xl font-bold">
        One word at a time
      </Text3dFlip>
    </div>
  );
}
