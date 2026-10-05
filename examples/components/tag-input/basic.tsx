import { TagInput } from "@rdloom/react";

export default function TagInputBasicExample() {
  return (
    <div className="w-96 max-w-full">
      <TagInput label="Keywords" description="Press Enter or comma to add a keyword." defaultValue={["design", "accessibility"]} placeholder="Add a keyword" />
    </div>
  );
}
