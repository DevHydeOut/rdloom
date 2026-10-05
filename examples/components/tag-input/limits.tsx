import { useState } from "react";
import { TagInput } from "@rdloom/react";

export default function TagInputLimitsExample() {
  const [tags, setTags] = useState<string[]>(["ada@example.com", "grace@example.com"]);
  return (
    <div className="w-96 max-w-full">
      <TagInput
        label="Recipients"
        description={`${tags.length} of 4. Duplicates are ignored.`}
        value={tags}
        onChange={setTags}
        maxTags={4}
        placeholder="name@example.com"
      />
    </div>
  );
}
