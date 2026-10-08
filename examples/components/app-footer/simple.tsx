import { AppFooter } from "@rdloom/react";

export default function AppFooterSimpleExample() {
  return (
    <div className="flex min-h-[14rem] w-full items-center justify-center">
      <div className="w-full max-w-5xl">
        <AppFooter
          text="© 2026 rdloom. All rights reserved."
          links={[
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
            { label: "Status", href: "https://status.example.com", external: true },
          ]}
        />
      </div>
    </div>
  );
}
