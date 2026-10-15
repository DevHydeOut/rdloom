import { Dock, DockItem, FileIcon, GlobeIcon, HomeIcon } from "@rdloom/react";

export default function DockLinksExample() {
  return (
    <div className="flex w-full justify-center py-6">
      <Dock label="Quick links" magnification={1.4}>
        <DockItem label="Home page" href="#home"><HomeIcon className="size-5" /></DockItem>
        <DockItem label="Documents" href="#documents"><FileIcon className="size-5" /></DockItem>
        <DockItem label="Website" href="#website"><GlobeIcon className="size-5" /></DockItem>
      </Dock>
    </div>
  );
}
