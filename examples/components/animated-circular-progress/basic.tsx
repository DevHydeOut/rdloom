import { AnimatedCircularProgress } from "@rdloom/react";

export default function AnimatedCircularProgressBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <AnimatedCircularProgress value={72} label="Storage used" />
    </div>
  );
}
