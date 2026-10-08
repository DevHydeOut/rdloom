import { InfoIcon, Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@rdloom/react";

export default function ItemMutedExample() {
  return (
    <div className="flex w-full justify-center">
      <Item variant="muted" className="max-w-md">
        <ItemMedia variant="icon">
          <InfoIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Billing moves to the first of the month</ItemTitle>
          <ItemDescription>Your next invoice covers the days from today until then.</ItemDescription>
        </ItemContent>
      </Item>
    </div>
  );
}
