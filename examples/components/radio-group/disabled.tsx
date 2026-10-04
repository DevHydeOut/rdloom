import { Radio, RadioGroup } from "@rdloom/react";

export default function RadioGroupDisabledExample() {
  return (
    <RadioGroup label="Region" defaultValue="eu" isDisabled>
      <Radio value="eu">Europe</Radio>
      <Radio value="us">United States</Radio>
    </RadioGroup>
  );
}
