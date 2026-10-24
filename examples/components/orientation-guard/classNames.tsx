import { OrientationGuard } from "@rdloom/react";

// Slots: root, content, overlay, icon, title, message, button. Your classes are added after the built-in ones.
export default function OrientationGuardClassNamesExample() {
  return (
    <div className="mx-auto h-80 w-[22rem] max-w-full overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)]">
      <OrientationGuard
        require="portrait"
        scope="container"
        current="landscape"
        classNames={{ overlay: "bg-[var(--rd-color-surface-subtle)]", title: "uppercase tracking-wide", button: "bg-[var(--rd-color-surface-default)]" }}
        className="h-full"
      >
        <div className="p-4 text-sm">Form</div>
      </OrientationGuard>
    </div>
  );
}
