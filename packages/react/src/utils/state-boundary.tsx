"use client";

import type { ReactNode } from "react";
import type { DataState } from "./state";

export interface StateBoundaryProps {
  state: DataState;
  /** Shown while the data loads. A skeleton or a spinner. */
  loading?: ReactNode;
  /** Shown when there is nothing to list yet. */
  empty?: ReactNode;
  /** Shown when loading failed. Say what happened and offer a retry. */
  error?: ReactNode;
  /** The data itself. */
  children?: ReactNode;
}

/** Renders the slot that matches a DataState. It does not fetch anything. */
export function StateBoundary({ state, loading = null, empty = null, error = null, children }: StateBoundaryProps) {
  switch (state) {
    case "loading":
      return <div aria-busy="true">{loading}</div>;
    case "empty":
      return <>{empty}</>;
    case "error":
      return <>{error}</>;
    default:
      return <>{children}</>;
  }
}
