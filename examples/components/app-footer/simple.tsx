import { AppFooter } from "@rdloom/react";

export default function AppFooterSimpleExample() {
  return (
    <div className="w-[64rem] max-w-full">
      <AppFooter
        text="© 2026 rdloom. All rights reserved."
        links={[
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
          { label: "Status", href: "https://status.example.com", external: true },
        ]}
      />
    </div>
  );
}
