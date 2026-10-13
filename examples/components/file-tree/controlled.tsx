import { useState } from "react";
import { FileTree, type FileTreeNode } from "@rdloom/react";

const items: FileTreeNode[] = [
  { id: "assets", name: "assets", children: [{ id: "hero", name: "hero.webp" }, { id: "icon", name: "icon.svg" }] },
  { id: "main", name: "main.py" },
  { id: "readme", name: "README.md" },
];

export default function FileTreeControlledExample() {
  const [selected, setSelected] = useState<Set<string>>(new Set(["main"]));
  const [open, setOpen] = useState<Set<string>>(new Set(["assets"]));
  const [last, setLast] = useState("");
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="w-72">
        <FileTree
          label="Controlled files"
          items={items}
          selectedKeys={selected}
          onSelectionChange={(keys) => setSelected(keys === "all" ? new Set() : new Set([...keys].map(String)))}
          expandedKeys={open}
          onExpandedChange={(keys) => setOpen(new Set([...keys].map(String)))}
          onAction={(key) => setLast(String(key))}
        />
      </div>
      <p className="text-sm text-[var(--rd-color-text-muted)]" aria-live="polite">
        Selected: {[...selected].join(", ") || "nothing"}. Last opened: {last || "none"}.
      </p>
    </div>
  );
}
