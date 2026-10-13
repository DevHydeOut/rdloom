import { MorphingText } from "@rdloom/react";

// A longer interval and a slower morph suit a large hero line.
export default function MorphingTextSlowAndLargeExample() {
  return (
    <div className="flex w-full justify-center text-5xl font-bold">
      <MorphingText texts={["Fewer clicks", "Faster pages", "Calmer teams"]} interval={4000} duration={1400} />
    </div>
  );
}
