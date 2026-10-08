import { NativeSelect } from "@rdloom/react";

export default function NativeSelectDisabledExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-xs">
        <NativeSelect
          label="Region"
          isDisabled
          defaultValue="eu"
          description="Fixed after the workspace is created."
          options={[
            { value: "eu", label: "Europe" },
            { value: "na", label: "North America" },
          ]}
        />
      </div>
    </div>
  );
}
