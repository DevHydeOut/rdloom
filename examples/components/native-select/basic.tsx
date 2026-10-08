import { NativeSelect } from "@rdloom/react";

export default function NativeSelectBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-xs">
        <NativeSelect
          label="Country"
          name="country"
          placeholder="Choose a country"
          description="Used for tax and shipping."
          options={[
            { value: "ca", label: "Canada" },
            { value: "de", label: "Germany" },
            { value: "in", label: "India" },
            { value: "us", label: "United States" },
          ]}
        />
      </div>
    </div>
  );
}
