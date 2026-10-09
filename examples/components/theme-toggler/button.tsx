import { ThemeToggler } from "@rdloom/react";

// One button that cycles light, dark and system. Its name says the current choice and the next one.
export default function ThemeTogglerButtonExample() {
  return (
    <div className="flex w-full justify-center">
      <ThemeToggler mode="button" defaultValue="light" />
    </div>
  );
}
