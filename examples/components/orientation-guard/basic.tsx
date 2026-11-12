import { OrientationGuard } from "@rdloom/react";

// Wrap the screen that needs an orientation. On a phone held the other way a message covers it until the phone is turned or the person
// chooses Continue anyway. On a tablet, a laptop or a desktop window it never appears, so here you only see the form.
// A web page cannot lock the screen; to see the message, open the "Inside a frame" example, which lets you turn a pretend phone.
export default function OrientationGuardBasicExample() {
  return (
    <OrientationGuard require="portrait">
      <form className="mx-auto flex w-full max-w-sm flex-col gap-3" onSubmit={(event) => event.preventDefault()}>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Full name
          <input className="rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-transparent px-3 py-2 text-base font-normal" autoComplete="name" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Address
          <input className="rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-transparent px-3 py-2 text-base font-normal" autoComplete="street-address" />
        </label>
        <button type="submit" className="min-h-11 rounded-[var(--rd-radius-control)] bg-[var(--rd-color-action-primary)] px-4 text-sm font-medium text-[var(--rd-color-action-on-primary)]">
          Continue
        </button>
      </form>
    </OrientationGuard>
  );
}
