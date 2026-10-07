// Finding the control to focus inside a field or a repeating row. Inputs from
// React Aria keep a hidden twin for native form posts; those are skipped.

const FOCUSABLE =
  'input:not([type="hidden"]), textarea, select, button, a[href], [role="combobox"], [role="spinbutton"], [role="switch"], [tabindex="0"]';

function isUsable(el: Element): boolean {
  if (el.closest('[aria-hidden="true"]')) return false;
  if (el.getAttribute("tabindex") === "-1") return false;
  if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    if (el.disabled) return false;
  }
  return el.getAttribute("aria-disabled") !== "true";
}

/** The first control inside `root` that a person can reach with the keyboard. */
export function firstFocusable(root: Element | null | undefined): HTMLElement | null {
  if (!root) return null;
  return ([...root.querySelectorAll(FOCUSABLE)].find(isUsable) as HTMLElement | undefined) ?? null;
}

/** The wrapper a Field or FieldArray puts around its control, found by name. */
export function findFieldRoot(form: Element | null | undefined, name: string): Element | null {
  if (!form) return null;
  return [...form.querySelectorAll("[data-rd-field]")].find((el) => el.getAttribute("data-rd-field") === name) ?? null;
}
