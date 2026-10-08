import { ScrollArea } from "@rdloom/react";

const tags = ["Design", "Engineering", "Marketing", "Finance", "Support", "Legal", "People", "Security", "Data", "Sales", "Research"];

export default function ScrollAreaHorizontalTagsExample() {
  return (
    <div className="flex w-full justify-center">
      <ScrollArea label="Teams" orientation="horizontal" className="w-full max-w-sm">
        <ul className="flex w-max gap-2 pb-3">
          {tags.map((tag) => (
            <li key={tag} className="whitespace-nowrap rounded-full border border-[var(--rd-color-border-default)] px-3 py-1 text-sm">
              {tag}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
