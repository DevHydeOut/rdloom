import { useState } from "react";
import { Rating } from "@rdloom/react";

export default function RatingHalfStarsExample() {
  const [value, setValue] = useState(3.5);

  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <Rating label="Rating" allowHalf value={value} onChange={setValue} />
      <p className="text-sm" aria-live="polite">
        {value} out of 5
      </p>
    </div>
  );
}
