import { AppFooter } from "@rdloom/react";

export default function AppFooterColumnsExample() {
  return (
    <div className="w-[64rem] max-w-full">
      <AppFooter
        layout="columns"
        text="© 2026 rdloom. All rights reserved."
        links={[
          { title: "Product", links: [{ label: "Features", href: "/features" }, { label: "Pricing", href: "/pricing" }, { label: "Changelog", href: "/changelog" }] },
          { title: "Company", links: [{ label: "About", href: "/about" }, { label: "Careers", href: "/careers" }, { label: "Contact", href: "/contact" }] },
          { title: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }] },
        ]}
        social={
          <a href="/feed" className="rounded-[var(--rd-radius-control)] text-sm text-[var(--rd-color-text-muted)] hover:text-[var(--rd-color-text-default)] hover:underline">
            Blog feed
          </a>
        }
      />
    </div>
  );
}
