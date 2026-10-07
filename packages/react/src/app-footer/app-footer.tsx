import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { appFooterDefaults, type AppFooterSpecProps } from "../generated/app-footer.types";
import { cx } from "../utils/cx";
import { isGroups, type FooterLink, type FooterLinkGroup } from "./links";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface AppFooterProps
  extends AppFooterSpecProps,
    Omit<HTMLAttributes<HTMLElement>, keyof AppFooterSpecProps | "className" | "children"> {
  className?: string;
}

const linkClass =
  "rounded-[var(--rd-radius-control)] text-sm text-[var(--rd-color-text-muted)] outline-none transition-colors hover:text-[var(--rd-color-text-default)] hover:underline " +
  "focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]";

/**
 * The footer of an application or marketing page. It has one fixed width and spacing, so it looks
 * the same on every page: change it once through `classNames`, not page by page. Links come as
 * plain data; pass `renderLink` to draw them with your router's link.
 */
export const AppFooter = forwardRef<HTMLElement, AppFooterProps>(function AppFooter(
  { text, links, social, layout = appFooterDefaults.layout, navLabel = appFooterDefaults.navLabel, renderLink, classNames, className, ...rest },
  ref,
) {
  const groups: FooterLinkGroup[] = !links || links.length === 0 ? [] : isGroups(links) ? links : [{ title: "", links }];
  const flat: FooterLink[] = groups.flatMap((g) => g.links);
  const columns = layout === "columns";

  const draw = (link: FooterLink): ReactNode => {
    const cls = cx(linkClass, classNames?.link);
    const label = link.external ? (
      <>
        {link.label}
        <span className="sr-only"> (opens in a new tab)</span>
      </>
    ) : (
      link.label
    );
    if (renderLink) return renderLink({ link, className: cls, children: label });
    return (
      <a href={link.href} className={cls} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {label}
      </a>
    );
  };

  return (
    <footer {...rest} ref={ref} className={cx("w-full border-t border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]", classNames?.root, className)}>
      <div className={cx("mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8", classNames?.inner)}>
        {columns && groups.length > 0 && (
          <nav aria-label={navLabel} className={cx("grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4", classNames?.nav)}>
            {groups.map((group, i) => (
              <div key={group.title || i} className={cx("flex min-w-0 flex-col gap-3", classNames?.group)}>
                {group.title && <h2 className={cx("text-sm font-semibold text-[var(--rd-color-text-default)]", classNames?.groupTitle)}>{group.title}</h2>}
                <ul className={cx("flex flex-col gap-2", classNames?.list)}>
                  {group.links.map((link) => (
                    <li key={link.href + link.label}>{draw(link)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        )}
        <div className={cx("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", columns && groups.length > 0 && "border-t border-[var(--rd-color-border-default)] pt-6")}>
          {text && <div className={cx("text-sm text-[var(--rd-color-text-muted)]", classNames?.text)}>{text}</div>}
          {!columns && flat.length > 0 && (
            <nav aria-label={navLabel} className={classNames?.nav}>
              <ul className={cx("flex flex-wrap items-center gap-x-6 gap-y-2", classNames?.list)}>
                {flat.map((link) => (
                  <li key={link.href + link.label}>{draw(link)}</li>
                ))}
              </ul>
            </nav>
          )}
          {social && <div className={cx("flex flex-wrap items-center gap-2", classNames?.social)}>{social}</div>}
        </div>
      </div>
    </footer>
  );
});
