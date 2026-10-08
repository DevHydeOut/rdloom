import { Menubar, MenubarItem, MenubarMenu, MenubarSeparator } from "@rdloom/react";

export default function MenubarWithDisabledItemsExample() {
  return (
    <div className="flex min-h-72 w-full items-start justify-center">
      <Menubar label="Application">
        <MenubarMenu label="File">
          <MenubarItem id="save" shortcut={["Ctrl", "S"]}>Save</MenubarItem>
          <MenubarItem id="revert" isDisabled>Revert to saved</MenubarItem>
          <MenubarSeparator />
          <MenubarItem id="print" shortcut={["Ctrl", "P"]} isDisabled>Print</MenubarItem>
        </MenubarMenu>
        <MenubarMenu label="Edit">
          <MenubarItem id="undo" shortcut={["Ctrl", "Z"]} isDisabled>Undo</MenubarItem>
          <MenubarItem id="paste" shortcut={["Ctrl", "V"]}>Paste</MenubarItem>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
