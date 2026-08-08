import type { ClientBadgeData } from "@/components/ClientBadge";
import { CLIENT_LOGO_SRC_BY_NAME } from "@/features/site/data/clientLogos";

/**
 * Display KPIs for /trusted-by. Keep aligned with SOLUTIONS_PAGE_COPY.stats
 * and conservative floors in `BUSINESS_STATS_SAFE_DEFAULTS` (fallbacks.ts).
 * Do not invent higher project counts than the fallback floor without a dated source.
 */
export const TRUSTED_BY_STATS = [
  { value: "14+", label: "Years of experience" },
  { value: "120+", label: "Projects completed" },
  // Same floor as projects — not a separate client census. Label as selected orgs.
  { value: "120+", label: "Selected organisations" },
  { value: "20+", label: "Locations serviced" },
] as const;

/**
 * Full roster with logo assets. Every entry maps to a file under
 * public/assets/marketing/client-logos/ so badges never fall back to monograms only.
 */
export const TRUSTED_BY_CLIENTS: ClientBadgeData[] = [
  { name: "Ambuja Neotia", sector: "Corporate" },
  { name: "Annapurna Finance", sector: "Finance" },
  { name: "BSPHCL", sector: "Energy" },
  { name: "Bureau of Indian Standards", sector: "Government" },
  { name: "Canara Bank", sector: "Finance" },
  { name: "Corporation Bank", sector: "Finance" },
  { name: "CRI Pumps", sector: "Manufacturing" },
  { name: "Customs and Central Excise", sector: "Government" },
  { name: "D. Goenka School", sector: "Education" },
  { name: "Essel Utilities", sector: "Energy" },
  { name: "FHI 360", sector: "NGO / UN" },
  { name: "Franklin Templeton", sector: "Finance" },
  { name: "Government of Bihar", sector: "Government" },
  { name: "HDFC", sector: "Finance" },
  { name: "Hyundai", sector: "Automotive" },
  { name: "IDBI Bank", sector: "Finance" },
  { name: "Income Tax Department", sector: "Government" },
  { name: "IndianOil", sector: "Energy" },
  { name: "JSW", sector: "Manufacturing" },
  { name: "L&T", sector: "Manufacturing" },
  { name: "Maruti Suzuki", sector: "Automotive" },
  { name: "MECON", sector: "Manufacturing" },
  { name: "Paradeep Phosphates", sector: "Manufacturing" },
  { name: "SAIL", sector: "Manufacturing" },
  { name: "Shriram", sector: "Finance" },
  { name: "SITI Networks", sector: "Telecom" },
  { name: "Sonalika", sector: "Manufacturing" },
  { name: "Survey of India", sector: "Government" },
  { name: "Syndicate Bank", sector: "Finance" },
  { name: "Tata Motors", sector: "Automotive" },
  { name: "Titan", sector: "Manufacturing", location: "Patna, Bihar" },
  { name: "Ujjivan Small Finance Bank", sector: "Finance" },
  { name: "United Bank of India", sector: "Finance" },
  { name: "Usha", sector: "Manufacturing" },
] as const satisfies ClientBadgeData[];

/** Dev/test helper: every roster name must resolve a logo path. */
export function trustedByClientsMissingLogos(): string[] {
  return TRUSTED_BY_CLIENTS.filter(
    (c) => !CLIENT_LOGO_SRC_BY_NAME[c.name] && !c.logoSrc,
  ).map((c) => c.name);
}
