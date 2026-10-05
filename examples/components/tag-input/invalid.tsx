import { TagInput } from "@rdloom/react";

export default function TagInputInvalidExample() {
  return (
    <div className="w-96 max-w-full">
      <TagInput label="Labels" isInvalid errorMessage="Add at least one label." />
    </div>
  );
}
