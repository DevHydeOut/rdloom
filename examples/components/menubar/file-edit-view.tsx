import { Menubar, MenubarItem, MenubarMenu, MenubarSeparator, MenubarSubmenu } from "@rdloom/react";

export default function MenubarFileEditViewExample() {
  return (
    <div className="flex min-h-72 w-full items-start justify-center">
      <Menubar label="Application">
        <MenubarMenu label="File">
          <MenubarItem id="new" shortcut={["Ctrl", "N"]}>New document</MenubarItem>
          <MenubarItem id="open" shortcut={["Ctrl", "O"]}>Open</MenubarItem>
          <MenubarSubmenu label="Export as">
            <MenubarItem id="pdf">PDF</MenubarItem>
            <MenubarItem id="html">HTML</MenubarItem>
            <MenubarItem id="text">Plain text</MenubarItem>
          </MenubarSubmenu>
          <MenubarSeparator />
          <MenubarItem id="save" shortcut={["Ctrl", "S"]}>Save</MenubarItem>
        </MenubarMenu>
        <MenubarMenu label="Edit">
          <MenubarItem id="undo" shortcut={["Ctrl", "Z"]}>Undo</MenubarItem>
          <MenubarItem id="redo" shortcut={["Ctrl", "Shift", "Z"]}>Redo</MenubarItem>
          <MenubarSeparator />
          <MenubarItem id="find" shortcut={["Ctrl", "F"]}>Find</MenubarItem>
        </MenubarMenu>
        <MenubarMenu label="View">
          <MenubarItem id="zoom-in" shortcut={["Ctrl", "+"]}>Zoom in</MenubarItem>
          <MenubarItem id="zoom-out" shortcut={["Ctrl", "-"]}>Zoom out</MenubarItem>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
