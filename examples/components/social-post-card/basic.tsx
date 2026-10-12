"use client";

import { useState } from "react";
import { SocialPostCard } from "@rdloom/react";

export default function SocialPostCardBasicExample() {
  const [liked, setLiked] = useState(false);
  return (
    <div className="flex w-full justify-center">
      <SocialPostCard
        name="Ada Example"
        handle="ada"
        timestamp="2h"
        dateTime="2026-03-12T10:00:00Z"
        replyCount={12}
        repostCount={1840}
        likeCount={liked ? 12346 : 12345}
        isLiked={liked}
        onReply={() => undefined}
        onRepost={() => undefined}
        onLike={() => setLiked((v) => !v)}
      >
        Shipped the first version of the new settings page today. Keyboard users can reach every control.
      </SocialPostCard>
    </div>
  );
}
