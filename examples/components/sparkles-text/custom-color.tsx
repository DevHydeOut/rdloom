import { SparklesText } from "@rdloom/react";

export default function SparklesTextCustomColorExample() {
  return (
    <div className="flex w-full justify-center py-6">
      <SparklesText count={12} color="#d97706" className="text-4xl font-bold">
        Golden moments
      </SparklesText>
    </div>
  );
}
