import { Blockquote, InlineCode, List, ListItem } from "@rdloom/react";

export default function TypographyListsAndQuoteExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-md flex-col gap-4">
        <List>
          <ListItem>Install the package</ListItem>
          <ListItem>
            Import <InlineCode>Heading</InlineCode> where you need it
          </ListItem>
        </List>
        <List ordered>
          <ListItem>Write the spec</ListItem>
          <ListItem>Build the component</ListItem>
        </List>
        <Blockquote source="A teammate">Say what the page is for before you style it.</Blockquote>
      </div>
    </div>
  );
}
