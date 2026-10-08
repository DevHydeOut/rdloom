import { NativeSelect } from "@rdloom/react";

export default function NativeSelectWithGroupsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-xs">
        <NativeSelect label="Time zone" name="timezone" defaultValue="europe-berlin">
          <optgroup label="Europe">
            <option value="europe-london">London</option>
            <option value="europe-berlin">Berlin</option>
          </optgroup>
          <optgroup label="Asia">
            <option value="asia-kolkata">Kolkata</option>
            <option value="asia-tokyo">Tokyo</option>
          </optgroup>
        </NativeSelect>
      </div>
    </div>
  );
}
