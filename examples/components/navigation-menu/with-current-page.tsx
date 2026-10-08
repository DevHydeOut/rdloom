import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuTrigger } from "@rdloom/react";

export default function NavigationMenuWithCurrentPageExample() {
  return (
    <div className="flex min-h-[22rem] w-full items-start justify-center">
      <NavigationMenu label="Main">
        <NavigationMenuItem>
          <NavigationMenuLink href="#home">Home</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger isCurrent>Guides</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-80 gap-1">
              <NavigationMenuLink href="#start" title="Getting started" description="Install and build your first page." />
              <NavigationMenuLink href="#theming" title="Theming" description="Colors, type and spacing through tokens." isCurrent />
              <NavigationMenuLink href="#testing" title="Testing" description="Check keyboard and screen reader behavior." />
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#reference">Reference</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenu>
    </div>
  );
}
