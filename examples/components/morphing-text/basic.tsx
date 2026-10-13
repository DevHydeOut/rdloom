import { MorphingText } from "@rdloom/react";

export default function MorphingTextBasicExample() {
  return (
    <div className="flex w-full justify-center text-3xl font-semibold">
      <MorphingText texts={["Design", "Build", "Ship", "Repeat"]} />
    </div>
  );
}
