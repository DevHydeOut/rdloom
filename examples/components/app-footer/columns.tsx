import { AppFooter } from "@rdloom/react";

export default function AppFooterColumnsExample() {
  return (
    <div className="flex min-h-[14rem] w-full items-center justify-center">
      <div className="w-full max-w-5xl">
        <AppFooter
          layout="columns"
          text="© 2026 rdloom. All rights reserved."
          links={[
            { title: "Product", links: [{ label: "Features", href: "/features" }, { label: "Pricing", href: "/pricing" }, { label: "Changelog", href: "/changelog" }] },
            { title: "Company", links: [{ label: "About", href: "/about" }, { label: "Careers", href: "/careers" }, { label: "Contact", href: "/contact" }] },
            { title: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }] },
          ]}
          social={
            <a href="/feed" className="inline-flex min-h-6 items-center rounded-[var(--rd-radius-control)] text-sm text-[var(--rd-color-text-muted)] hover:text-[var(--rd-color-text-default)] hover:underline">
              Blog feed
            </a>
          }
        />
      </div>
    </div>
  );
}
