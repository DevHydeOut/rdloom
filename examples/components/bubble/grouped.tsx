import { Avatar, Bubble, BubbleGroup, BubbleList, Button } from "@rdloom/react";

export default function BubbleGroupedExample() {
  return (
    <div className="flex w-full justify-center">
      <BubbleList className="w-[28rem] max-w-full">
        <BubbleGroup aria-label="Messages from Alex">
          <Bubble name="Alex" avatar={<Avatar name="Alex Rivera" size="sm" decorative />}>
            Did you see the new design?
          </Bubble>
          <Bubble name="Alex" avatar={<Avatar name="Alex Rivera" size="sm" decorative />}>
            I moved the filters to the top.
          </Bubble>
          <Bubble
            name="Alex"
            avatar={<Avatar name="Alex Rivera" size="sm" decorative />}
            timestamp="2026-10-08T09:15:00"
            timestampText="09:15"
            actions={
              <Button variant="ghost" size="sm">
                Copy
              </Button>
            }
          >
            Tell me what you think.
          </Bubble>
        </BubbleGroup>
        <BubbleGroup aria-label="Your messages">
          <Bubble from="user">Looks good.</Bubble>
          <Bubble from="user" timestamp="2026-10-08T09:16:00" timestampText="09:16">
            Can we ship it today?
          </Bubble>
        </BubbleGroup>
      </BubbleList>
    </div>
  );
}
