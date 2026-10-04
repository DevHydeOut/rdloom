import { Radio, RadioGroup } from "@rdloom/react";

export default function RadioGroupHorizontalExample() {
  return (
    <RadioGroup label="Billing" orientation="horizontal" defaultValue="monthly">
      <Radio value="monthly">Monthly</Radio>
      <Radio value="yearly">Yearly</Radio>
    </RadioGroup>
  );
}
