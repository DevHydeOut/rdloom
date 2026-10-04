import { Slider } from "@rdloom/react";

export default function SliderDisabledExample() {
  return (
    <div className="w-72">
      <Slider label="Brightness" defaultValue={70} isDisabled />
    </div>
  );
}
