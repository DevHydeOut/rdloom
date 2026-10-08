import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuTrigger } from "@rdloom/react";

export default function NavigationMenuBasicExample() {
  return (
    <div className="flex min-h-[22rem] w-full items-start justify-center">
      <NavigationMenu label="Main">
        <NavigationMenuItem>
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-80 gap-1">
              <NavigationMenuLink href="#analytics" title="Analytics" description="Track visits, sign-ups and revenue in one place." />
              <NavigationMenuLink href="#automations" title="Automations" description="Run routine steps without doing them by hand." />
              <NavigationMenuLink href="#integrations" title="Integrations" description="Connect the tools your team already uses." />
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-80 gap-1">
              <NavigationMenuLink href="#guides" title="Guides" description="Step-by-step help for common tasks." />
              <NavigationMenuLink href="#changelog" title="Changelog" description="What changed in each release." />
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#pricing">Pricing</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenu>
    </div>
  );
}
