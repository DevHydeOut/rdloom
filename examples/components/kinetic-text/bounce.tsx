import { KineticText } from "@rdloom/react";

export default function KineticTextBounceExample() {
  return (
    <div className="flex w-full justify-center">
      <KineticText effect="bounce" stagger={0.1} className="text-3xl font-bold">
        Boing boing
      </KineticText>
    </div>
  );
}
