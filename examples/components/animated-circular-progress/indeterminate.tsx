import { AnimatedCircularProgress } from "@rdloom/react";

export default function AnimatedCircularProgressIndeterminateExample() {
  return (
    <div className="flex w-full justify-center">
      <AnimatedCircularProgress isIndeterminate size={56} thickness={6} label="Importing contacts" />
    </div>
  );
}
