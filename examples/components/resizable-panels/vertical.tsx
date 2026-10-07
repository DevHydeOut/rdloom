import type { ReactNode } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@rdloom/react";

function Pane({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-1 p-4 text-sm text-[var(--rd-color-text-default)]">
      <p className="font-semibold">{title}</p>
      {children ? <p className="text-[var(--rd-color-text-muted)]">{children}</p> : null}
    </div>
  );
}

export default function ResizablePanelsVerticalExample() {
  return (
    <div className="mx-auto h-72 w-[40rem] max-w-full overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)]">
      <ResizablePanelGroup orientation="vertical">
        <ResizablePanel defaultSize={65} minSize={20}>
          <Pane title="Editor">Source goes here.</Pane>
        </ResizablePanel>
        <ResizableHandle withHandle label="Resize console" />
        <ResizablePanel minSize={15}>
          <Pane title="Console">Output goes here.</Pane>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
