"use client";

// Keep a screen's state in the address bar (search text, filters, sort, page, tab), so a refresh,
// a shared link and the back button all bring the same screen back.
//
// You describe the state once as a schema: for each key, its type, its default and (optionally)
// the name to use in the address. parseQueryState reads an address query into a typed object and
// serializeQueryState writes it back. Anything missing or invalid becomes the default; nothing
// here throws. Lists are written as repeated keys (?tag=a&tag=b).
//
// useQueryState works with any router: your app says how to read the current query and how to
// write a new one (Next.js, Remix, React Router or plain history). useWindowQueryState is the
// plain-browser version using window.location and history. Nothing touches window unless you use
// that hook, and it is safe to render on the server. Writing keeps every other parameter in the
// address as it was. Nothing is debounced: debounce typing in your own code if you need it.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type QueryField =
  | { type: "string"; default: string; name?: string }
  | { type: "number"; default: number; name?: string; min?: number; max?: number; integer?: boolean }
  | { type: "boolean"; default: boolean; name?: string }
  | { type: "enum"; values: readonly string[]; default: string; name?: string }
  | { type: "array"; default: readonly string[]; name?: string };

export type QuerySchema = Record<string, QueryField>;

type FieldValue<F extends QueryField> = F extends { type: "string" }
  ? string
  : F extends { type: "number" }
    ? number
    : F extends { type: "boolean" }
      ? boolean
      : F extends { type: "enum"; values: readonly (infer V)[] }
        ? V
        : F extends { type: "array" }
          ? string[]
          : never;

/** The typed state a schema describes. Use `as const` on enum values to get a union type. */
export type QueryState<S extends QuerySchema> = { [K in keyof S]: FieldValue<S[K]> };

const urlName = (key: string, field: QueryField) => field.name ?? key;

function toParams(search: string | URLSearchParams): URLSearchParams {
  if (typeof search !== "string") return new URLSearchParams(search);
  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
}

function clamp(n: number, field: Extract<QueryField, { type: "number" }>): number {
  let value = field.integer === false ? n : Math.trunc(n);
  if (field.min != null && value < field.min) value = field.min;
  if (field.max != null && value > field.max) value = field.max;
  return value;
}

function readField(params: URLSearchParams, key: string, field: QueryField): unknown {
  const name = urlName(key, field);
  const raw = params.getAll(name);
  switch (field.type) {
    case "string":
      return raw.length ? raw[0] : field.default;
    case "number": {
      if (!raw.length || raw[0].trim() === "") return clamp(field.default, field);
      const n = Number(raw[0]);
      return Number.isFinite(n) ? clamp(n, field) : clamp(field.default, field);
    }
    case "boolean": {
      const v = raw[0];
      if (v === "true" || v === "1") return true;
      if (v === "false" || v === "0") return false;
      return field.default;
    }
    case "enum":
      return raw.length && field.values.includes(raw[0]) ? raw[0] : field.default;
    case "array":
      return raw.length ? raw : [...field.default];
  }
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => v === b[i]);
  return a === b;
}

/** Reads an address query ("?page=2&tag=a" or "page=2") into typed state. Missing or invalid values become the default. */
export function parseQueryState<S extends QuerySchema>(search: string | URLSearchParams, schema: S): QueryState<S> {
  const params = toParams(search);
  const state: Record<string, unknown> = {};
  for (const key of Object.keys(schema)) state[key] = readField(params, key, schema[key]);
  return state as QueryState<S>;
}

export interface SerializeOptions {
  /** Leave out values equal to their default, for a shorter address. Default true. */
  omitDefaults?: boolean;
  /** An existing query whose other parameters are kept. Parameters named in the schema are replaced. */
  base?: string | URLSearchParams;
}

/** Writes state to a query string (without the leading "?"). Other parameters in `base` are kept. */
export function serializeQueryState<S extends QuerySchema>(
  state: Partial<QueryState<S>>,
  schema: S,
  { omitDefaults = true, base }: SerializeOptions = {},
): string {
  const params = base === undefined ? new URLSearchParams() : toParams(base);
  for (const key of Object.keys(schema)) {
    const field = schema[key];
    const name = urlName(key, field);
    params.delete(name);
    const value = key in state ? (state as Record<string, unknown>)[key] : field.default;
    // Run the value through the reader so an out-of-range or wrong-typed value is cleaned the same way.
    const clean = readField(toParams(writeOne(name, field, value)), key, field);
    if (omitDefaults && sameValue(clean, readField(new URLSearchParams(), key, field))) continue;
    for (const [k, v] of toParams(writeOne(name, field, clean))) params.append(k, v);
  }
  return params.toString();
}

function writeOne(name: string, field: QueryField, value: unknown): string {
  const out = new URLSearchParams();
  if (field.type === "array") {
    const list = Array.isArray(value) ? value : [];
    for (const item of list) out.append(name, String(item));
  } else if (value !== undefined && value !== null) {
    out.set(name, String(value));
  }
  return out.toString();
}

export interface UseQueryStateOptions {
  /** The current query string, read from your router (for example useSearchParams().toString()). */
  search: string;
  /** Called with the new full query string (no "?"). Write it to the address with your router. */
  onChange: (search: string) => void;
  /** Leave out values equal to their default. Default true. */
  omitDefaults?: boolean;
}

export type QueryStateUpdate<S extends QuerySchema> = Partial<QueryState<S>> | ((current: QueryState<S>) => Partial<QueryState<S>>);

/**
 * State kept in the address. The app supplies how to read and write the query, so it works with any router.
 * Returns [state, setState]; setState merges the changes you pass and keeps unrelated parameters.
 */
export function useQueryState<S extends QuerySchema>(
  schema: S,
  { search, onChange, omitDefaults = true }: UseQueryStateOptions,
): [QueryState<S>, (update: QueryStateUpdate<S>) => void] {
  const state = useMemo(() => parseQueryState(search, schema), [search, schema]);
  const latest = useRef({ search, state, onChange, schema, omitDefaults });
  latest.current = { search, state, onChange, schema, omitDefaults };

  const setState = useCallback((update: QueryStateUpdate<S>) => {
    const { state: current, search: currentSearch, schema: sch, onChange: change, omitDefaults: omit } = latest.current;
    const patch = typeof update === "function" ? update(current) : update;
    const next = { ...current, ...patch } as QueryState<S>;
    const query = serializeQueryState(next, sch, { omitDefaults: omit, base: currentSearch });
    // Keep what the next call reads in step, so two updates in the same tick build on each other.
    latest.current.search = query;
    latest.current.state = parseQueryState(query, sch);
    change(query);
  }, []);

  return [state, setState];
}

export interface UseWindowQueryStateOptions {
  /** "push" adds a history entry (back button steps through changes); "replace" overwrites the current one. Default "push". */
  mode?: "push" | "replace";
  omitDefaults?: boolean;
}

/** The query string of the current address, or "" on the server. */
function windowSearch(): string {
  return typeof window === "undefined" ? "" : window.location.search.replace(/^\?/, "");
}

/**
 * useQueryState on the plain browser address. Renders with the default state on the server and
 * first client render, reads the real address after mount, and follows the back and forward buttons.
 */
export function useWindowQueryState<S extends QuerySchema>(
  schema: S,
  { mode = "push", omitDefaults = true }: UseWindowQueryStateOptions = {},
): [QueryState<S>, (update: QueryStateUpdate<S>) => void] {
  const [search, setSearch] = useState("");
  useEffect(() => {
    setSearch(windowSearch());
    const onPop = () => setSearch(windowSearch());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const onChange = useCallback(
    (next: string) => {
      const url = `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`;
      if (mode === "replace") window.history.replaceState(window.history.state, "", url);
      else window.history.pushState(window.history.state, "", url);
      setSearch(next);
    },
    [mode],
  );

  return useQueryState(schema, { search, onChange, omitDefaults });
}
