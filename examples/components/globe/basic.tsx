import { Globe } from "@rdloom/react";

export default function GlobeBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-xs">
        <Globe label="Globe" description="A slowly turning globe of dots showing the continents. Drag to turn it." />
      </div>
    </div>
  );
}
