import { NativeSelect } from "@rdloom/react";

export default function NativeSelectInvalidExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-xs">
        <NativeSelect
          label="Billing plan"
          placeholder="Choose a plan"
          isRequired
          isInvalid
          errorMessage="Choose a plan to continue."
          options={[
            { value: "starter", label: "Starter" },
            { value: "team", label: "Team" },
          ]}
        />
      </div>
    </div>
  );
}
