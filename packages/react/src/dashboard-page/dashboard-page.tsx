"use client";

import { forwardRef, useId } from "react";
import { dashboardPageDefaults, type DashboardPageSpecProps } from "../generated/dashboard-page.types";
import { PageHeader } from "../page-header/page-header";
import { Stat } from "../stat/stat";
import { cx } from "../utils/cx";

export interface DashboardPageProps extends DashboardPageSpecProps {
  className?: string;
}

/**
 * One page of a dashboard: a title with its actions, a row of key numbers, then your content. It
 * sits inside DashboardShell but works anywhere. The title is the page's h1, so the page has one
 * clear heading to jump to.
 */
export const DashboardPage = forwardRef<HTMLDivElement, DashboardPageProps>(function DashboardPage(
  { title, description, actions, stats, isLoading = dashboardPageDefaults.isLoading, children, classNames, className },
  ref,
) {
  const statsId = useId();
  return (
    <div ref={ref} aria-busy={isLoading || undefined} className={cx("mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6 p-4 sm:p-6 lg:p-8", classNames?.root, className)}>
      <PageHeader
        title={title}
        description={description}
        actions={actions}
        classNames={{ root: classNames?.header, title: classNames?.title, description: classNames?.description, actions: classNames?.actions }}
      />

      {stats && stats.length > 0 && (
        <section aria-labelledby={statsId} className={classNames?.stats}>
          <h2 id={statsId} className="sr-only">
            Key numbers
          </h2>
          {/* As many columns as fit, each at least 10rem: four across on a wide page, two on a tablet or a phone. They follow the space the page has, not the screen. */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(10rem,100%),1fr))] gap-4">
            {stats.map((s) => (
              <Stat key={s.label} className={classNames?.stat} variant="card" label={s.label} value={s.value} trend={s.trend} data={s.data} description={s.description} summary={s.summary} isLoading={isLoading} />
            ))}
          </div>
        </section>
      )}

      {children && <div className={cx("flex min-w-0 flex-col gap-6", classNames?.content)}>{children}</div>}
    </div>
  );
});
