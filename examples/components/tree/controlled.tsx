import { useState } from "react";
import { Tree, TreeItem } from "@rdloom/react";

export default function TreeControlledExample() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["a"]));
  return (
    <div className="flex w-72 flex-col gap-2 text-sm">
      <Tree label="Outline" expandedKeys={expanded} onExpandedChange={(keys) => setExpanded(new Set([...keys].map(String)))}>
        <TreeItem id="a" title="Chapter 1">
          <TreeItem id="a1" title="Section 1.1" />
          <TreeItem id="a2" title="Section 1.2" />
        </TreeItem>
        <TreeItem id="b" title="Chapter 2">
          <TreeItem id="b1" title="Section 2.1" />
        </TreeItem>
      </Tree>
      <p aria-live="polite">Expanded: {[...expanded].join(", ") || "none"}</p>
    </div>
  );
}
