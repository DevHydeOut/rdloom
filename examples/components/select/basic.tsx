import { Select, SelectItem } from "@rdloom/react";

export default function SelectBasicExample() {
  return (
    <Select className="w-64" label="Country" placeholder="Choose a country">
      <SelectItem id="in">India</SelectItem>
      <SelectItem id="us">United States</SelectItem>
      <SelectItem id="de">Germany</SelectItem>
      <SelectItem id="jp">Japan</SelectItem>
    </Select>
  );
}
