import { SocialPostCard } from "@rdloom/react";

export default function SocialPostCardWithMediaExample() {
  return (
    <div className="flex w-full justify-center">
      <SocialPostCard
        name="Grace Sample"
        handle="@grace"
        timestamp="12 Mar"
        replyCount={3}
        likeCount={87}
        onReply={() => undefined}
        onLike={() => undefined}
        media={
          <div
            role="img"
            aria-label="Soft gradient placeholder"
            className="h-40 w-full"
            style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--rd-color-action-primary) 35%, transparent), transparent)" }}
          />
        }
        linkPreview={
          <div className="p-3 text-sm">
            <p className="m-0 font-medium">Notes from the design review</p>
            <p className="m-0 text-[var(--rd-color-text-muted)]">example.test/notes</p>
          </div>
        }
      >
        Notes from the design review, with the key decisions in the link below.
      </SocialPostCard>
    </div>
  );
}
