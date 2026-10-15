import { FileTree, type FileTreeNode } from "@rdloom/react";

const items: FileTreeNode[] = [
  {
    id: "src",
    name: "src",
    children: [
      {
        id: "components",
        name: "components",
        children: [
          { id: "card", name: "card.tsx" },
          { id: "menu", name: "menu.tsx" },
        ],
      },
      { id: "index", name: "index.ts" },
      { id: "logo", name: "logo.png" },
    ],
  },
  { id: "docs", name: "docs", children: [{ id: "readme", name: "README.md" }] },
  { id: "package", name: "package.json" },
  { id: "license", name: "LICENSE" },
];

export default function FileTreeBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-72">
        <FileTree label="Project files" items={items} defaultExpandedKeys={["src"]} />
      </div>
    </div>
  );
}
