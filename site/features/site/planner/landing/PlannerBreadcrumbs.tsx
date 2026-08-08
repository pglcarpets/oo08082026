import Link from "next/link";

export type PlannerBreadcrumbItem = {
  label: string;
  href?: string;
};

/** Consistent breadcrumb trail for planner marketing sub-pages. */
export function PlannerBreadcrumbs({ items }: { items: PlannerBreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-2 text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="text-subtle">
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link href={item.href} className="typ-nav transition-colors hover:text-strong">
                  {item.label}
                </Link>
              ) : (
                <span className="typ-nav text-strong" aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
