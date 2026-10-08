"use client";

import { createContext, forwardRef, useContext, useMemo } from "react";
import { I18nProvider, useLocale } from "react-aria-components";
import { directionDefaults, type DirectionSpecProps } from "../generated/direction.types";

export interface DirectionProps
  extends DirectionSpecProps,
    Omit<React.HTMLAttributes<HTMLDivElement>, keyof DirectionSpecProps | "dir"> {}

type Dir = NonNullable<DirectionSpecProps["direction"]>;

const DirectionContext = createContext<{ direction: Dir; locale: string } | null>(null);

const defaultLocale: Record<Dir, string> = { ltr: "en-US", rtl: "ar" };

/** The direction and locale in effect here. Outside a Direction it follows the surrounding React Aria locale. */
export function useDirection(): { direction: Dir; locale: string } {
  const ctx = useContext(DirectionContext);
  const { locale, direction } = useLocale();
  return ctx ?? { direction, locale };
}

/** Sets the reading direction for its subtree: the dir attribute for the browser and the locale for React Aria keyboard handling. */
export const Direction = forwardRef<HTMLDivElement, DirectionProps>(function Direction(
  { direction = directionDefaults.direction, locale, children, ...rest },
  ref,
) {
  const resolved = locale ?? defaultLocale[direction];
  const value = useMemo(() => ({ direction, locale: resolved }), [direction, resolved]);
  return (
    <DirectionContext.Provider value={value}>
      <I18nProvider locale={resolved}>
        <div {...rest} ref={ref} dir={direction}>
          {children}
        </div>
      </I18nProvider>
    </DirectionContext.Provider>
  );
});
