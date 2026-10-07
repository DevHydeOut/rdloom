import type { ReactNode } from "react";
import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@rdloom/react";

function Pane({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-1 p-4 text-sm text-[var(--rd-color-text-default)]">
      <p className="font-semibold">{title}</p>
      {children ? <p className="text-[var(--rd-color-text-muted)]">{children}</p> : null}
    </div>
  );
}

export default function ResizablePanelsPersistedExample() {
  const [layout, setLayout] = useState<number[]>([]);
  return (
    <div className="mx-auto flex w-[40rem] max-w-full flex-col gap-2">
      <div className="mx-auto h-72 w-[40rem] max-w-full overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)]">
        <ResizablePanelGroup autoSaveId="docs-persisted-example" onLayoutChange={(sizes) => setLayout(sizes.map((s) => Math.round(s)))}>
          <ResizablePanel defaultSize={40} minSize={20}>
            <Pane title="Left">Resize, then reload the page: the sizes are remembered.</Pane>
          </ResizablePanel>
          <ResizableHandle withHandle label="Resize panels" />
          <ResizablePanel minSize={20}>
            <Pane title="Right" />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <p className="text-center text-sm text-[var(--rd-color-text-muted)]">Last change: {layout.length ? layout.join(" / ") : "none yet"}</p>
    </div>
  );
}
