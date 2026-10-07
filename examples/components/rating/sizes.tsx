import { Rating } from "@rdloom/react";

export default function RatingSizesExample() {
  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <Rating label="Small rating" size="sm" defaultValue={2} />
      <Rating label="Medium rating" size="md" defaultValue={3} />
      <Rating label="Large rating" size="lg" defaultValue={4} />
    </div>
  );
}
