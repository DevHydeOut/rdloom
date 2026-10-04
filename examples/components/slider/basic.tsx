import { Slider } from "@rdloom/react";

export default function SliderBasicExample() {
  return (
    <div className="w-72">
      <Slider label="Volume" defaultValue={40} />
    </div>
  );
}
