import { HyperText } from "@rdloom/react";

// whenInView is off, so the text sits still until the pointer enters it.
export default function HyperTextOnHoverOnlyExample() {
  return (
    <div className="flex w-full justify-center">
      <HyperText whenInView={false} className="text-2xl font-semibold">
        Access granted
      </HyperText>
    </div>
  );
}
