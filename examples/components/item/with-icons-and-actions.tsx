import { Button, FileIcon, Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@rdloom/react";

const files = [
  { name: "Q3 report.pdf", meta: "2.4 MB, edited yesterday" },
  { name: "Brand guide.pdf", meta: "8.1 MB, edited 3 days ago" },
];

export default function ItemWithIconsAndActionsExample() {
  return (
    <div className="flex w-full justify-center">
      <ItemGroup aria-label="Files" className="max-w-md gap-2">
        {files.map((f) => (
          <Item key={f.name} variant="outline">
            <ItemMedia variant="icon">
              <FileIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{f.name}</ItemTitle>
              <ItemDescription>{f.meta}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="secondary" size="sm">
                Download
              </Button>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </div>
  );
}
