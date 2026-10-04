import { Checkbox } from "@rdloom/react";

export default function CheckboxDisabledExample() {
  return (
    <div className="flex flex-col gap-2">
      <Checkbox isDisabled>Beta features</Checkbox>
      <Checkbox isDisabled defaultSelected>
        Required cookies
      </Checkbox>
    </div>
  );
}
