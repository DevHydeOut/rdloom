import { Fragment } from "react";
import { Avatar, Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from "@rdloom/react";

const people = [
  { name: "Ada Lovelace", email: "ada@example.com" },
  { name: "Grace Hopper", email: "grace@example.com" },
  { name: "Katherine Johnson", email: "katherine@example.com" },
];

export default function ItemGroupedExample() {
  return (
    <div className="flex w-full justify-center">
      <ItemGroup aria-label="Members" className="max-w-sm">
        {people.map((p, i) => (
          <Fragment key={p.email}>
            {i > 0 ? <ItemSeparator /> : null}
            <Item size="sm">
              <ItemMedia>
                <Avatar name={p.name} size="sm" decorative />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{p.name}</ItemTitle>
                <ItemDescription>{p.email}</ItemDescription>
              </ItemContent>
            </Item>
          </Fragment>
        ))}
      </ItemGroup>
    </div>
  );
}
