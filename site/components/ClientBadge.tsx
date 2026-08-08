import Image from "next/image";
import clsx from "clsx";

import { resolveClientLogoSrc } from "@/features/site/data/clientLogos";

export interface ClientBadgeData {
  name: string;
  sector: string;
  location?: string;
  /** Optional explicit logo path under /assets/marketing/client-logos/ */
  logoSrc?: string;
}

interface ClientBadgeProps extends ClientBadgeData {
  featured?: boolean;
}

function monogramFromName(name: string): string {
  const parts = name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {return "?";}
  if (parts.length === 1) {return parts[0].slice(0, 2).toUpperCase();}
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function ClientBadge({
  name,
  sector,
  location,
  logoSrc: explicitLogoSrc,
  featured = false,
}: ClientBadgeProps) {
  const logoSrc = resolveClientLogoSrc(name, explicitLogoSrc);

  return (
    <div className={clsx("client-badge group", featured && "client-badge--featured")}>
      <div className="flex items-start justify-between gap-2">
        <span className="client-badge__sector">{sector}</span>
      </div>

      <div className="client-badge__mark">
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt={`${name} logo`}
            width={160}
            height={48}
            sizes="(max-width: 640px) 40vw, 160px"
            className="client-badge__logo"
            style={{ width: "auto", height: "2.75rem", maxWidth: "100%", objectFit: "contain" }}
          />
        ) : (
          <span className="client-badge__monogram" aria-hidden="true">
            {monogramFromName(name)}
          </span>
        )}
      </div>

      <div className="client-badge__body">
        <h3 className="client-badge__name">{name}</h3>
        {location ? <p className="client-badge__location">{location}</p> : null}
      </div>
    </div>
  );
}
