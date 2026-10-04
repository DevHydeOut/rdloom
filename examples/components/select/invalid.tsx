import { Button, Select, SelectItem } from "@rdloom/react";

export default function SelectInvalidExample() {
  return (
    <form className="flex flex-col items-start gap-3" onSubmit={(e) => e.preventDefault()}>
      {/* Submit without choosing to see the error. */}
      <Select className="w-64" label="Department" isRequired>
        <SelectItem id="eng">Engineering</SelectItem>
        <SelectItem id="sales">Sales</SelectItem>
      </Select>
      <Button type="submit">Save</Button>
    </form>
  );
}
