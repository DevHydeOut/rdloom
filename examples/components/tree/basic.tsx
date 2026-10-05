import { Tree, TreeItem } from "@rdloom/react";

export default function TreeBasicExample() {
  return (
    <div className="w-72">
      <Tree label="Files" defaultExpandedKeys={["src"]}>
        <TreeItem id="src" title="src">
          <TreeItem id="components" title="components">
            <TreeItem id="button" title="button.tsx" />
            <TreeItem id="menu" title="menu.tsx" />
          </TreeItem>
          <TreeItem id="index" title="index.ts" />
        </TreeItem>
        <TreeItem id="docs" title="docs">
          <TreeItem id="readme" title="README.md" />
        </TreeItem>
        <TreeItem id="package" title="package.json" />
      </Tree>
    </div>
  );
}
