import { OrientationGuard } from "@rdloom/react";

// dismissible={false} removes Continue anyway. Use it only when the content truly cannot work the other way: some people cannot turn their
// device, and WCAG 2.2 criterion 1.3.4 asks that content is not locked to one orientation unless that is essential.
export default function OrientationGuardRequiredExample() {
  return (
    <div className="mx-auto h-80 w-[22rem] max-w-full overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)]">
      <OrientationGuard require="landscape" scope="container" current="portrait" dismissible={false} className="h-full">
        <div className="p-4 text-sm">Sign here</div>
      </OrientationGuard>
    </div>
  );
}
