import { Avatar, HoverCard, HoverCardContent, HoverCardTrigger } from "@rdloom/react";

// The same links exist on the profile page, so the card is a shortcut and never the only way in.
export default function HoverCardWithLinksExample() {
  return (
    <div className="flex justify-center p-10">
      <p className="text-sm">
        Assigned to{" "}
        <HoverCard>
          <HoverCardTrigger href="#grace-hopper">Grace Hopper</HoverCardTrigger>
          <HoverCardContent label="Grace Hopper, profile preview">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar name="Grace Hopper" decorative />
                <div>
                  <p className="font-semibold">Grace Hopper</p>
                  <p className="text-[var(--rd-color-text-muted)]">Compilers team</p>
                </div>
              </div>
              <p className="text-[var(--rd-color-text-muted)]">Tab moves into the card; Esc closes it and keeps your place.</p>
              <div className="flex gap-4">
                <a href="#grace-profile" className="font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]">
                  View profile
                </a>
                <a href="#grace-open-work" className="font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]">
                  Open work
                </a>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        .
      </p>
    </div>
  );
}
