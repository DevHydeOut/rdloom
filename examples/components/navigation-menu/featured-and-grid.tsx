import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuTrigger } from "@rdloom/react";

export default function NavigationMenuFeaturedAndGridExample() {
  return (
    <div className="flex min-h-[24rem] w-full items-start justify-center">
      <NavigationMenu label="Main" align="center">
        <NavigationMenuItem>
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[34rem] max-w-full grid-cols-[1fr_1.4fr] gap-2">
              <NavigationMenuLink href="#overview" isFeatured title="Solutions overview" description="See how teams of different sizes use the platform." />
              <div className="grid grid-cols-2 gap-1">
                <NavigationMenuLink href="#startups" title="Startups" description="Launch quickly." />
                <NavigationMenuLink href="#agencies" title="Agencies" description="Manage many clients." />
                <NavigationMenuLink href="#enterprise" title="Enterprise" description="Control and audit." />
                <NavigationMenuLink href="#education" title="Education" description="Courses and cohorts." />
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#docs">Docs</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#blog">Blog</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenu>
    </div>
  );
}
