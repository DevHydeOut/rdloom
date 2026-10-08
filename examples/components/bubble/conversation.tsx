import { Avatar, Bubble } from "@rdloom/react";

export default function BubbleConversationExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-[28rem] max-w-full flex-col gap-4">
        <Bubble from="assistant" name="Support" avatar={<Avatar name="Support" size="sm" decorative />} timestamp="2026-10-08T10:41:00" timestampText="10:41">
          Hi, how can I help today?
        </Bubble>
        <Bubble from="user" name="You" timestamp="2026-10-08T10:42:00" timestampText="10:42">
          My invoice shows the wrong address.
        </Bubble>
        <Bubble from="assistant" name="Support" avatar={<Avatar name="Support" size="sm" decorative />} timestamp="2026-10-08T10:43:00" timestampText="10:43">
          I can fix that. Which address should it show?
        </Bubble>
      </div>
    </div>
  );
}
