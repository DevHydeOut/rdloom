import { Button, ChevronRightIcon, HomeIcon, Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle, SettingsIcon } from "@rdloom/react";

export default function ItemAsLinksExample() {
  return (
    <div className="flex w-full justify-center">
      <ItemGroup aria-label="Workspace" className="max-w-md gap-2">
        <Item variant="outline" href="#overview">
          <ItemMedia variant="icon">
            <HomeIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Overview</ItemTitle>
            <ItemDescription>Activity across all projects</ItemDescription>
          </ItemContent>
          <ItemActions>
            <ChevronRightIcon />
          </ItemActions>
        </Item>
        <Item variant="outline" href="#settings">
          <ItemMedia variant="icon">
            <SettingsIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Settings</ItemTitle>
            <ItemDescription>Open the settings page, or reset it from here</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="ghost" size="sm">
              Reset
            </Button>
          </ItemActions>
        </Item>
      </ItemGroup>
    </div>
  );
}
