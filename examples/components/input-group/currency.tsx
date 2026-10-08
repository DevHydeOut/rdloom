import { InputGroup, InputGroupAddon, InputGroupInput } from "@rdloom/react";

export default function InputGroupCurrencyExample() {
  return (
    <div className="flex w-full justify-center">
      <InputGroup label="Amount" description="Charged once, when you confirm." className="w-64">
        <InputGroupAddon>$</InputGroupAddon>
        <InputGroupInput inputMode="decimal" placeholder="0.00" />
        <InputGroupAddon align="end">USD</InputGroupAddon>
      </InputGroup>
    </div>
  );
}
