// The two kinds of state every screen has, kept as two separate types.
// DataState describes the data a screen shows; ActionState describes something
// the person did (a submit, a delete). Both map onto flags apps already have
// from their own data layer. Nothing here fetches or caches anything.

/** What a screen has to show: wait for it, nothing to show, it failed, or it is here. */
export type DataState = "loading" | "empty" | "error" | "ready";

/** What happened to an action: not started, running, worked, or failed. */
export type ActionState = "idle" | "pending" | "success" | "error";

/** Maps the flags most data libraries return to a DataState. Errors win, then loading, then empty. */
export function toDataState({
  isLoading,
  error,
  isEmpty,
}: {
  isLoading?: boolean;
  error?: unknown;
  isEmpty?: boolean;
}): DataState {
  if (error) return "error";
  if (isLoading) return "loading";
  return isEmpty ? "empty" : "ready";
}

/** Maps the flags most mutation helpers return to an ActionState. */
export function toActionState({
  isPending,
  error,
  isSuccess,
}: {
  isPending?: boolean;
  error?: unknown;
  isSuccess?: boolean;
}): ActionState {
  if (isPending) return "pending";
  if (error) return "error";
  return isSuccess ? "success" : "idle";
}
