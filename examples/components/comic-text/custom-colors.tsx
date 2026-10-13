import { ComicText } from "@rdloom/react";

export default function ComicTextCustomColorsExample() {
  return (
    <div className="flex w-full justify-center py-6">
      <ComicText fill="#fde047" outline="#1e1b4b" className="text-6xl">
        Wow
      </ComicText>
    </div>
  );
}
