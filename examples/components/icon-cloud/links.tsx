import { IconCloud } from "@rdloom/react";

const pages = ["Docs", "Guides", "Blog", "Pricing", "Status", "Team", "Jobs", "Help"];

export default function IconCloudLinksExample() {
  return (
    <div className="flex w-full justify-center py-4">
      <IconCloud
        size={300}
        iconSize={48}
        duration={60}
        label="Sample pages"
        items={pages.map((page) => ({
          label: page,
          href: "#",
          icon: (
            <span className="flex size-12 items-center justify-center rounded-full border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] text-[11px] text-[var(--rd-color-text-default)]">
              {page}
            </span>
          ),
        }))}
      />
    </div>
  );
}
