import { Avatar, HoverCard, HoverCardContent, HoverCardTrigger } from "@rdloom/react";

export default function HoverCardBasicExample() {
  return (
    <div className="flex justify-center p-10">
      <p className="text-sm">
        Reviewed by{" "}
        <HoverCard>
          <HoverCardTrigger href="#ada-lovelace">Ada Lovelace</HoverCardTrigger>
          <HoverCardContent label="Ada Lovelace, profile preview">
            <div className="flex gap-3">
              <Avatar name="Ada Lovelace" decorative />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Ada Lovelace</p>
                <p className="text-[var(--rd-color-text-muted)]">Staff engineer, Platform</p>
                <p className="text-[var(--rd-color-text-muted)]">Joined March 2021 · 48 reviews</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>{" "}
        on Friday.
      </p>
    </div>
  );
}
