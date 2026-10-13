import { HyperText } from "@rdloom/react";

// A slower settle suits a long line. Keep it under about two seconds.
export default function HyperTextSlowExample() {
  return (
    <div className="flex w-full justify-center">
      <HyperText duration={1600} onHover={false} className="text-2xl font-semibold">
        Signal acquired
      </HyperText>
    </div>
  );
}
