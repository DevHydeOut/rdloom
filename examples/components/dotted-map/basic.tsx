import { DottedMap } from "@rdloom/react";

export default function DottedMapBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-xl">
        <DottedMap label="World map" description="A map of the world drawn in small dots." />
      </div>
    </div>
  );
}
