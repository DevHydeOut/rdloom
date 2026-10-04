import { Button, DatePicker } from "@rdloom/react";

export default function DatePickerInvalidExample() {
  return (
    <form className="flex flex-col items-start gap-3" onSubmit={(e) => e.preventDefault()}>
      {/* Submit it empty to see the error. */}
      <DatePicker className="w-64" label="Start date" isRequired />
      <Button type="submit">Save</Button>
    </form>
  );
}
