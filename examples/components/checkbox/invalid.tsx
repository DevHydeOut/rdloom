import { Button, Checkbox } from "@rdloom/react";

export default function CheckboxInvalidExample() {
  return (
    <form className="flex flex-col items-start gap-3" onSubmit={(e) => e.preventDefault()}>
      {/* Submit without checking it to see the error. */}
      <Checkbox isRequired>I accept the terms</Checkbox>
      <Button type="submit">Continue</Button>
    </form>
  );
}
