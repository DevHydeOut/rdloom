import { useState } from "react";
import { Rating } from "@rdloom/react";

export default function RatingBasicExample() {
  const [value, setValue] = useState(3);

  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <Rating label="Rating" value={value} onChange={setValue} clearable />
      <p className="text-sm" aria-live="polite">
        {value === 0 ? "No rating yet" : `You rated ${value} out of 5`}
      </p>
    </div>
  );
}
