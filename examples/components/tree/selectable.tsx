import { Tree, TreeItem } from "@rdloom/react";

export default function TreeSelectableExample() {
  return (
    <div className="w-72">
      <Tree label="Categories" selectionMode="multiple" defaultExpandedKeys={["fruit"]} defaultSelectedKeys={["apple"]}>
        <TreeItem id="fruit" title="Fruit">
          <TreeItem id="apple" title="Apple" />
          <TreeItem id="pear" title="Pear" />
        </TreeItem>
        <TreeItem id="veg" title="Vegetables">
          <TreeItem id="carrot" title="Carrot" />
        </TreeItem>
      </Tree>
    </div>
  );
}
