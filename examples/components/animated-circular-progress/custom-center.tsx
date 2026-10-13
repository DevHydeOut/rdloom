import { AnimatedCircularProgress } from "@rdloom/react";

export default function AnimatedCircularProgressCustomCenterExample() {
  return (
    <div className="flex w-full justify-center">
      <AnimatedCircularProgress value={18} maxValue={20} size={112} thickness={10} label="Tasks done">
        <span className="relative text-center text-sm leading-tight">
          <span className="block text-lg font-semibold">18</span>
          of 20
        </span>
      </AnimatedCircularProgress>
    </div>
  );
}
