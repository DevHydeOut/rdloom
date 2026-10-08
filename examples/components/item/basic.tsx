import { Avatar, Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@rdloom/react";

const people = [
  { name: "Ada Lovelace", role: "Engineering lead" },
  { name: "Grace Hopper", role: "Platform" },
  { name: "Katherine Johnson", role: "Data" },
];

export default function ItemBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <ItemGroup aria-label="Team" className="max-w-sm">
        {people.map((p) => (
          <Item key={p.name}>
            <ItemMedia>
              <Avatar name={p.name} decorative />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{p.name}</ItemTitle>
              <ItemDescription>{p.role}</ItemDescription>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </div>
  );
}
