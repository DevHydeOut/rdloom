import { Rating } from "@rdloom/react";

export default function RatingReadOnlyWithCountExample() {
  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <Rating label="Average rating" value={4.5} allowHalf isReadOnly count={1284} />
      <Rating label="Average rating" value={3.8} isReadOnly count={96} countLabel="reviews" size="sm" />
    </div>
  );
}
