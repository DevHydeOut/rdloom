import { Radio, RadioGroup } from "@rdloom/react";

export default function RadioGroupBasicExample() {
  return (
    <RadioGroup label="Plan" defaultValue="pro">
      <Radio value="free">Free</Radio>
      <Radio value="pro">Pro</Radio>
      <Radio value="team">Team</Radio>
    </RadioGroup>
  );
}
