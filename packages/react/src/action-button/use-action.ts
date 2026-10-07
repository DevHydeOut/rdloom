"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActionState } from "../utils/state";

export interface UseActionOptions {
  onSuccess?: (result: unknown) => void;
  onError?: (error: unknown) => void;
  onStateChange?: (state: ActionState) => void;
}

export interface UseActionResult {
  state: ActionState;
  /** Runs the action. Ignored while one is pending. Never rejects: a failure becomes state "error" and onError. */
  run: () => Promise<void>;
  isPending: boolean;
}

/**
 * Runs one action at a time and reports idle, pending, success or error. It does not fetch,
 * cache or show messages; use it to build your own control, or through ActionButton.
 */
export function useAction(onAction: () => void | Promise<unknown>, options: UseActionOptions = {}): UseActionResult {
  const [state, setState] = useState<ActionState>("idle");
  const pending = useRef(false);
  const latest = useRef({ onAction, options });
  latest.current = { onAction, options };
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const move = useCallback((next: ActionState) => {
    if (mounted.current) setState(next);
    latest.current.options.onStateChange?.(next);
  }, []);

  const run = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    move("pending");
    let result: unknown;
    try {
      result = await latest.current.onAction();
    } catch (error) {
      pending.current = false;
      move("error");
      latest.current.options.onError?.(error);
      return;
    }
    pending.current = false;
    move("success");
    latest.current.options.onSuccess?.(result);
  }, [move]);

  return { state, run, isPending: state === "pending" };
}
