import { FileTree, type FileTreeNode } from "@rdloom/react";

const items: FileTreeNode[] = [
  {
    id: "app",
    name: "app",
    children: [
      { id: "page", name: "page.tsx", size: "2.1 KB", status: "modified" },
      { id: "layout", name: "layout.tsx", size: "1.4 KB" },
      { id: "styles", name: "styles.css", size: "6.8 KB", status: "added" },
    ],
  },
  { id: "notes", name: "notes.txt", size: "312 B", status: "deleted" },
  { id: "config", name: "config.json", size: "0.9 KB" },
];

export default function FileTreeWithSizesAndStatusExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-80">
        <FileTree label="Changed files" items={items} defaultExpandedKeys={["app"]} />
      </div>
    </div>
  );
}
