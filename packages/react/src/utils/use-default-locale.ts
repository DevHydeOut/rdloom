"use client";

import { useLocale } from "react-aria-components";

/**
 * The locale a component formats numbers and dates with. An explicit locale wins. Otherwise it is
 * React Aria's locale: en-US while rendering on the server and during hydration, the browser's
 * language after that. Never call Intl or toLocale*String with an undefined locale in a component:
 * the server and the first client render would disagree and React would report a hydration error.
 */
export function useDefaultLocale(explicit?: string): string {
  const { locale } = useLocale();
  return explicit || locale;
}

/** Narrow no-break and thin spaces differ between Node and browsers; one normal space reads the same everywhere. */
export function plainSpaces(text: string): string {
  return text.replace(/[   ]/g, " ");
}
