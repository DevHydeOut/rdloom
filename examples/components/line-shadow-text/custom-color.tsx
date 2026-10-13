import { LineShadowText } from "@rdloom/react";

export default function LineShadowTextCustomColorExample() {
  return (
    <div className="flex w-full justify-center py-6">
      <LineShadowText shadowColor="#dc2626" className="text-6xl font-black">
        Bold lines
      </LineShadowText>
    </div>
  );
}
