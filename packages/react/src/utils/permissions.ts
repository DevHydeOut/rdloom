// How a block learns what the person may do. Your app decides (from roles, plans, record state, anything);
// the block only receives the answer for each action. This is for what people see and can try: the server
// must check every action again, because anything in the browser can be changed.

/** What a block does with an action: show it normally, show it but not allow it, or leave it out. */
export type PermissionState = "allow" | "disabled" | "hidden";

/**
 * An answer for one action. true and false are the short forms (false means disabled). Use an object to say
 * why, so the person is told: { state: "disabled", reason: "Only admins can delete" }.
 */
export type PermissionValue = boolean | PermissionState | { state: PermissionState; reason?: string };

/** The answers for a block's actions, by action name. An action you leave out is allowed. */
export type Permissions<Action extends string = string> = Partial<Record<Action, PermissionValue>>;

export interface ResolvedPermission {
  state: PermissionState;
  /** Why the action is disabled or hidden, when the app said. */
  reason?: string;
  /** Show the control at all. */
  isVisible: boolean;
  /** Show it but do not allow it. */
  isDisabled: boolean;
  /** Run it. */
  isAllowed: boolean;
}

function resolved(state: PermissionState, reason?: string): ResolvedPermission {
  return { state, reason, isVisible: state !== "hidden", isDisabled: state === "disabled", isAllowed: state === "allow" };
}

/** Turns any form of answer into one shape. A missing answer means allowed. */
export function resolvePermission(value: PermissionValue | undefined): ResolvedPermission {
  if (value === undefined || value === true) return resolved("allow");
  if (value === false) return resolved("disabled");
  if (typeof value === "string") return resolved(value);
  return resolved(value.state, value.reason);
}

/** The answer for one action in a block's permissions. */
export function permissionFor<Action extends string>(permissions: Permissions<Action> | undefined, action: Action): ResolvedPermission {
  return resolvePermission(permissions?.[action]);
}

/** True when the action may run. */
export const can = <Action extends string>(permissions: Permissions<Action> | undefined, action: Action) => permissionFor(permissions, action).isAllowed;

/** Builds a Permissions object from yes/no answers, e.g. from a function you already have. */
export function permissionsFrom<Action extends string>(actions: readonly Action[], check: (action: Action) => boolean, reason?: (action: Action) => string | undefined): Permissions<Action> {
  const result: Permissions<Action> = {};
  for (const action of actions) result[action] = check(action) ? true : { state: "disabled", reason: reason?.(action) };
  return result;
}
