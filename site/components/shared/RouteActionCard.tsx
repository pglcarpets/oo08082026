import { TrackedLink } from "@/components/ui/TrackedLink";

type RouteActionCardVariant = "primary" | "outline";

interface RouteActionCardAction {
  href: string;
  label: string;
  variant?: RouteActionCardVariant;
}

interface RouteActionCardProps {
  kicker?: string;
  title: string;
  description: string;
  actions: RouteActionCardAction[];
  className?: string;
  panelClassName?: string;
}

/** Explicit min-h-11 (≥44px) + full-width stack on phone. */
const actionVariantClassName: Record<RouteActionCardVariant, string> = {
  primary: "btn-primary min-h-11 w-full justify-center sm:w-auto",
  outline: "btn-outline min-h-11 w-full justify-center sm:w-auto",
};

const defaultPanelClassName =
  "scheme-panel scheme-border rounded-2xl border p-6 md:p-8";

export function RouteActionCard({
  kicker,
  title,
  description,
  actions,
  className = "",
  panelClassName = defaultPanelClassName,
}: RouteActionCardProps) {
  return (
    <div className={`${panelClassName} min-w-0 ${className}`.trim()}>
      {kicker ? <p className="typ-label text-contrast-accent mb-3">{kicker}</p> : null}
      <h3 className="typ-h3 text-strong">{title}</h3>
      <p className="page-copy text-body mt-4 max-w-3xl">{description}</p>
      <div className="mt-6 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        {actions.map((action) => (
          <TrackedLink
            key={`${action.href}-${action.label}`}
            href={action.href}
            label={action.label}
            surface="route-action-card"
            className={actionVariantClassName[action.variant ?? "outline"]}
          >
            {action.label}
          </TrackedLink>
        ))}
      </div>
    </div>
  );
}
