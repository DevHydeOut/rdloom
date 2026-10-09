import { useState } from "react";
import { ThemeToggler } from "@rdloom/react";

// Controlled: the page owns the choice. Nothing is stored for you; save it wherever your app keeps settings.
export default function ThemeTogglerBasicExample() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <ThemeToggler value={theme} onValueChange={setTheme} />
      <p className="m-0 text-sm text-[var(--rd-color-text-muted)]">Chosen: {theme}</p>
    </div>
  );
}
