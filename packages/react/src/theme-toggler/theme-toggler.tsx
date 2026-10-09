"use client";

import { forwardRef, useEffect, useState } from "react";
import { themeTogglerDefaults, type ThemeTogglerSpecProps } from "../generated/theme-toggler.types";
import { Button } from "../button/button";
import { ToggleGroup, ToggleGroupItem } from "../toggle-group/toggle-group";
import { cx } from "../utils/cx";
import { MonitorIcon, MoonIcon, SunIcon } from "../utils/icons";

export interface ThemeTogglerProps extends ThemeTogglerSpecProps {
  className?: string;
}

type Theme = "light" | "dark" | "system";

const order: Theme[] = ["light", "dark", "system"];
const names: Record<Theme, string> = { light: "Light", dark: "Dark", system: "System" };
const icons: Record<Theme, typeof SunIcon> = { light: SunIcon, dark: MoonIcon, system: MonitorIcon };

/**
 * A light, dark and system switch. It is controlled with value and onValueChange, or uncontrolled with
 * defaultValue. It stores nothing: persist the choice yourself. With applyToDocument it sets data-theme
 * (light or dark) on the page root, following the device setting live while "system" is chosen.
 */
export const ThemeToggler = forwardRef<HTMLDivElement, ThemeTogglerProps>(function ThemeToggler(
  {
    value,
    defaultValue = themeTogglerDefaults.defaultValue,
    onValueChange,
    mode = themeTogglerDefaults.mode,
    applyToDocument = themeTogglerDefaults.applyToDocument,
    size = themeTogglerDefaults.size,
    label = themeTogglerDefaults.label,
    isStill = themeTogglerDefaults.isStill,
    className,
  },
  ref,
) {
  const [own, setOwn] = useState<Theme>(defaultValue);
  // The icon only animates after a change, never on first paint.
  const [changed, setChanged] = useState(false);
  const current = value ?? own;

  const choose = (next: Theme) => {
    if (next === current) return;
    setChanged(true);
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  useEffect(() => {
    if (!applyToDocument || typeof document === "undefined") return;
    const root = document.documentElement;
    const query = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const apply = () => root.setAttribute("data-theme", current === "system" ? (query?.matches ? "dark" : "light") : current);
    apply();
    if (current !== "system" || !query?.addEventListener) return;
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [applyToDocument, current]);

  const animate = changed && !isStill;
  const iconSize = size === "lg" ? "size-5" : "size-4";

  if (mode === "button") {
    const next = order[(order.indexOf(current) + 1) % order.length];
    const Icon = icons[current];
    return (
      <Button
        ref={ref as never}
        variant="secondary"
        size={size}
        aria-label={`${label}: ${current}. Switch to ${next}`}
        onPress={() => choose(next)}
        className={cx("aspect-square !px-0", className)}
      >
        <span key={current} aria-hidden="true" className={cx("inline-flex", animate && "rdm-theme-icon")}>
          <Icon className={cx(iconSize, "shrink-0")} />
        </span>
      </Button>
    );
  }

  return (
    <ToggleGroup
      ref={ref}
      aria-label={label}
      size={size}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[current]}
      onSelectionChange={(keys) => {
        const key = [...keys][0] as Theme | undefined;
        if (key) choose(key);
      }}
      className={className}
    >
      {order.map((theme) => {
        const Icon = icons[theme];
        return (
          <ToggleGroupItem key={theme} id={theme} aria-label={names[theme]}>
            <span aria-hidden="true" className={cx("inline-flex", animate && theme === current && "rdm-theme-icon")}>
              <Icon className={cx(iconSize, "shrink-0")} />
            </span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
});
