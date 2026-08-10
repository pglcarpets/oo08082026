export type SiteSocialLink = {
  label: string;
  href: string;
  id: "youtube" | "facebook";
};

export const SITE_CONTACT = {
  brandName: "One&Only",
  /** Spoken / search form used in address blocks and local SEO copy. */
  brandNameSpoken: "One and Only Furniture",
  salesPhone: "+91 98356 30940",
  supportPhone: "+91 90310 22875",
  salesEmail: "sales@oando.co.in",
  /** Public security disclosure inbox (RFC 9116 security.txt Contact). */
  securityEmail: "sales@oando.co.in",
  regionLine: "India — multi-city commercial delivery · HQ Patna",
  openingHours: "Mo-Sa 09:00-18:00",
  priceRange: "INR",
  // Schema areaServed: national reach (physical HQ address stays accurate below).
  areaServed: ["India"],
  address: {
    streetAddress: "401, Jagat Trade Centre, Frazer Road",
    addressLocality: "Patna",
    postalCode: "800001",
    addressRegion: "Bihar",
    addressCountry: "IN",
  },
  geo: {
    latitude: 25.6127,
    longitude: 85.1376,
  },
  socialLinks: [
    {
      label: "YouTube",
      href: "https://www.youtube.com/channel/UCehXuPNAXkyfODPCwyAU1gQ",
      id: "youtube",
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/oandofurniture",
      id: "facebook",
    },
  ] satisfies SiteSocialLink[],
} as const;

export const FOOTER_CONVERSION_PANEL = {
  eyebrow: "Start in the right lane",
  title: "Need planning, documents, or a commercial next step?",
  description:
    "Use the planning route for layout guidance, the Resource Desk for packs and technical sheets, or contact sales when your team is ready to discuss scope and commercials.",
  actions: [
    {
      label: "Guided Planner",
      href: "/planning",
      variant: "primary" as const,
    },
    {
      label: "Open Resource Desk",
      href: "/downloads",
      variant: "secondary" as const,
    },
    {
      label: "Contact sales",
      href: "/contact",
      variant: "secondary" as const,
    },
  ],
  highlights: [
    "Planning-led guidance",
    "Resource Desk routing",
    "Sales and support continuity",
  ],
  responseLine:
    "India-wide team supporting multi-city office furniture rollouts, planning, and commercial delivery.",
  whatsappPrompt: "Need help choosing the right planning, documentation, or sales lane?",
} as const;

export const SUPPORT_PHONE_DIGITS = "919031022875";
export const SALES_PHONE_DIGITS = "919835630940";

/** `tel:` href with digits and optional leading `+` only (spaces/dashes stripped). */
export function toTelHref(phone: string) {
  const cleaned = phone.trim().replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}

export function formatSitePostalAddress() {
  const { streetAddress, addressLocality, postalCode, addressRegion, addressCountry } =
    SITE_CONTACT.address;
  const country = addressCountry === "IN" ? "India" : addressCountry;
  return [
    streetAddress,
    `${addressLocality}, ${addressRegion} ${postalCode}`,
    country,
  ].join("\n");
}

export function buildMailtoHref(subject?: string, body?: string) {
  const params = new URLSearchParams();
  if (subject) {params.set("subject", subject);}
  if (body) {params.set("body", body);}

  const query = params.toString();
  const mailtoBase = `mailto:${SITE_CONTACT.salesEmail}`;
  return query ? `${mailtoBase}?${query}` : mailtoBase;
}

export function buildWhatsAppHref(message: string, phoneDigits = SUPPORT_PHONE_DIGITS) {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneDigits}?text=${encodedMessage}`;
}
