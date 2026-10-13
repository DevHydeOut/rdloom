import { SocialPostCard } from "@rdloom/react";

export default function SocialPostCardCompactExample() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <SocialPostCard variant="compact" name="Lin Tester" handle="lin" timestamp="5m" likeCount={9} onLike={() => undefined}>
        Great talk, the demo at the end was the best part.
      </SocialPostCard>
      <SocialPostCard variant="compact" name="Sam Placeholder" handle="sam" timestamp="1h" replyCount={1} onReply={() => undefined}>
        Agreed. Slides are linked in the event page.
      </SocialPostCard>
    </div>
  );
}
