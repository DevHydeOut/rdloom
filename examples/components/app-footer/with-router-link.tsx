import { AppFooter } from "@rdloom/react";

// Draw the links with your router. A plain anchor stands in for it here; use your router link
// and give it the className and children you are handed.
export default function AppFooterWithRouterLinkExample() {
  return (
    <div className="flex min-h-[14rem] w-full items-center justify-center">
      <div className="w-full max-w-5xl">
        <AppFooter
          text="© 2026 rdloom"
          links={[
            { label: "Help", href: "/help" },
            { label: "Privacy", href: "/privacy" },
          ]}
          renderLink={({ link, className, children }) => (
            <a href={link.href} className={className}>
              {children}
            </a>
          )}
        />
      </div>
    </div>
  );
}
