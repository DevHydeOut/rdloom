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

export default function ResizablePanelsNestedExample() {
  return (
    <div className="mx-auto h-72 w-[40rem] max-w-full overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)]">
      <ResizablePanelGroup>
        <ResizablePanel defaultSize={25} minSize={15}>
          <Pane title="Files" />
        </ResizablePanel>
        <ResizableHandle withHandle label="Resize files" />
        <ResizablePanel>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={60} minSize={20}>
              <Pane title="Editor" />
            </ResizablePanel>
            <ResizableHandle withHandle label="Resize console" />
            <ResizablePanel minSize={15}>
              <Pane title="Console" />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
