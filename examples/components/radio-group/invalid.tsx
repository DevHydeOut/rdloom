import { Button, Radio, RadioGroup } from "@rdloom/react";

export default function RadioGroupInvalidExample() {
  return (
    <form className="flex flex-col items-start gap-3" onSubmit={(e) => e.preventDefault()}>
      {/* Submit without choosing to see the error. */}
      <RadioGroup label="Shipping" isRequired>
        <Radio value="standard">Standard</Radio>
        <Radio value="express">Express</Radio>
      </RadioGroup>
      <Button type="submit">Continue</Button>
    </form>
  );
}
