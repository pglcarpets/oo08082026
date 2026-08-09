import type { ClientBadgeData } from "@/components/ClientBadge";
import { buildWhatsAppHref } from "@/features/site/data/contact";

export const ABOUT_PAGE_COPY = {
  heroTitle: "About us",
  heroSubtitle:
    "Planning, supply, and install for workplaces across India — from brief to handover.",
  sectionKicker: "Who we are",
  sectionTitle: "Planning-first partner",
  paragraphs: [
    "We combine workplace planning, product selection, and execution support so teams can move from concept to handover with fewer delays and better outcomes.",
    "Our projects cover ergonomic seating, modular workstations, meeting environments, storage, and support services — including systems from Steelcase, Featherlite, Humanscale, and other authorized brands for enterprise and institutional needs.",
    "Every engagement is managed for clarity: documented scope, practical timelines, and accountable after-sales support.",
  ],
  confidenceKicker: "Client confidence",
  confidenceTitle: "Trusted by enterprise and institutional teams.",
  confidenceCta: "View all clients",
  modelKicker: "Operating model",
  modelTitle: "One team from planning brief to post-installation support.",
  modelDescription:
    "We keep planning, sourcing, execution, and support connected so projects stay clear from early decisions through handover.",
  modelPillars: [
    {
      title: "Planning-led recommendations",
      detail:
        "Category, budget, and layout decisions are tied to how teams actually use the space.",
    },
    {
      title: "Execution clarity",
      detail:
        "Commercial scope, timelines, delivery coordination, and installation readiness stay visible throughout the project.",
    },
    {
      title: "Support after handover",
      detail:
        "Warranty references, service routing, and follow-up support remain part of the same delivery relationship.",
    },
  ],
  processKicker: "How we work",
  processTitle: "A practical sequence for office projects.",
  processSteps: [
    {
      title: "Brief and site context",
      detail:
        "We map headcount, workspace type, commercial priorities, and the timing that matters for your team.",
    },
    {
      title: "Specification and alignment",
      detail:
        "Products, finishes, and quantity mixes are translated into a clear planning and approval path.",
    },
    {
      title: "Delivery and support",
      detail:
        "Installation, service routing, and after-sales follow-through stay connected to the original brief.",
    },
  ],
  supportTitle: "Need planning or documentation before you decide?",
  supportDescription:
    "Use the planning or Resource Desk lanes when your team needs layout guidance, category packs, technical sheets, or a clearer next step before procurement.",
  supportPrimaryCta: "Request planning call",
  supportSecondaryCta: "Open Resource Desk",
} as const;

export const CONTACT_PAGE_COPY = {
  heroTitle: "Contact",
  heroSubtitle: "Quotes, planning, and support for commercial workplaces across India.",
  sectionTitle: "Offices",
  introTitle: "Offices & channels",
  introDescription: "",
  resourceDeskLead: "Need packs or technical sheets first?",
  resourceDeskCta: "Resource Desk",
  resourceDeskTail: "for documentation matched to your brief.",
  quickDeskKicker: "Fast path",
  quickDeskTitle: "Pick a lane",
  quickDeskDescription: "Planning, documents, or quote — route to the right team.",
  quickDeskPrimaryCta: "Resource Desk",
  quickDeskSecondaryCta: "Planning call",
  channelRegionLabel: "Service region",
  channelQuotesLabel: "Quotes and planning",
  channelSupportLabel: "Support and enquiries",
  channelEmailLabel: "Email",
  channelsAriaLabel: "Phone, email, and service region",
  offices: [
    {
      title: "Corporate office",
      lines: ["401, Jagat Trade Centre", "Frazer Road", "Patna - 800 001", "India"],
    },
    {
      title: "Showroom",
      lines: [
        "One and Only Furniture Pvt Ltd",
        "Opp Patliputra Telephone Exchange",
        "North Industrial Estate Road",
        "Patna - 800 010",
        "India",
      ],
    },
  ],
} as const;

export const CONTACT_FORM_CONTEXT_COPY = {
  quote: {
    compare: {
      eyebrow: "Compare shortlist",
      title: "Quote request from compared products",
      description:
        "You came from the compare flow. Keep the shortlist context and tell us what commercial next step you need.",
      requirement: "Quote request from compare shortlist",
      seededMessage:
        "I need a quote for the products I compared and want the right next commercial step.",
    },
    "quote-cart": {
      eyebrow: "Quote cart",
      title: "Quote request from saved cart",
      description:
        "You came from the quote cart. Keep the shortlisted products together and tell us what you need next.",
      requirement: "Quote request from quote cart",
      seededMessage:
        "I need a quote for the products saved in my quote cart and want the next commercial step.",
    },
  },
} as const;

export const TRUSTED_BY_PAGE_COPY = {
  heroKicker: "Trust",
  heroTitleLead: "Trusted",
  heroTitleAccent: "by.",
  heroTitle: "Trusted by",
  heroSubtitle: "Government, finance, industry, and institutional teams.",
  overviewKicker: "Proof",
  overviewTitle: "Repeatable delivery",
  overviewDescription:
    "Enterprise offices, public institutions, and multi-city rollouts with clear planning and after-sales support.",
  statsKicker: "At a glance",
  craftQuote:
    "Trust shows up in repeat programmes — coordinated delivery, accountable handover, and support that stays after install.",
  craftAttribution: "Delivery perspective, One&Only programmes",
  paletteKicker: "Palette",
  paletteTitle: "Abstract trust, not logo walls",
  paletteDescription:
    "We show delivery proof through metrics, material discipline, and short quotes — not scrolling partner marks.",
  quotesKicker: "Voices",
  quotesTitle: "What teams remember",
  sectorsKicker: "Sectors",
  sectorsTitle: "Cross-sector trust",
  sectorsDescription:
    "Durable products, accountable delivery, and support after handover.",
  quotes: [
    {
      quote:
        "Scope stayed legible from planning through install — we knew what was arriving, when, and who owned each handover.",
      attribution: "Facilities lead, multi-city rollout",
    },
    {
      quote:
        "The programme felt coordinated, not transactional. Desking, meeting rooms, and support channels stayed aligned.",
      attribution: "Project coordinator, institutional workspace",
    },
  ],
  ctaKicker: "Next step",
  ctaTitleLead: "Start your",
  ctaTitleAccent: "brief.",
  ctaDescription: "Planning, quote, or Resource Desk for packs and sheets.",
  ctaPrimary: "Contact the team",
  ctaSecondary: "See client work",
} as const;

export const CLIENTS_PAGE_COPY = {
  heroTitle: "Clients",
  heroTitleLead: "Trusted",
  heroTitleAccent: "clients.",
  heroSubtitle:
    "Executed workplace deliveries across government, finance, energy, and manufacturing.",
  heroSubtitleTemplate:
    "{clients} organisations across government, finance, energy, and manufacturing.",
  heroBackgroundImage: "/assets/marketing/clients/DMRC/dmrc-1.webp",
  eyebrow: "Case studies",
  emptyTitle: "Gallery updating",
  emptyDescription:
    "Installation photos are being prepared. Browse trusted clients or contact the team.",
  contactCta: "Contact us",
  trustedCta: "Trusted by",
  planningCta: "Request planning call",
  pullQuotes: [
    {
      quote:
        "The team translated our brief into a practical layout with finishes we could approve quickly — and the installed result matched what we signed off.",
      attribution: "Facilities lead, corporate fit-out",
    },
    {
      quote:
        "Delivery stayed coordinated from desking through meeting rooms. Scope, timelines, and handover were clear throughout the programme.",
      attribution: "Project coordinator, institutional workspace",
    },
  ],
  ctaKicker: "Next step",
  ctaTitleLead: "Brief the",
  ctaTitleAccent: "planning team.",
  ctaDescription:
    "Share headcount, space type, and timing — we will align category mix, finishes, and a practical delivery path.",
} as const;

/** @deprecated Use CLIENTS_PAGE_COPY */
export const PROJECTS_PAGE_COPY = CLIENTS_PAGE_COPY;

export const CLIENTS_PAGE_CLIENTS: ClientBadgeData[] = [
  { name: "Adani Power", sector: "Energy" },
  { name: "Adecco", sector: "Corporate" },
  { name: "Ambuja Neotia", sector: "Corporate" },
  { name: "Annapurna Finance", sector: "Finance" },
  { name: "Asian Paints", sector: "FMCG" },
  { name: "Azim Premji Foundation", sector: "NGO / UN" },
  { name: "BBC Media Action", sector: "NGO / UN" },
  { name: "BHEL", sector: "Energy" },
  { name: "Bureau of Indian Standards", sector: "Government" },
  { name: "BNP Paribas", sector: "Finance" },
  { name: "BSPHCL", sector: "Energy", location: "Bihar" },
  { name: "Bandhan Bank", sector: "Finance" },
  { name: "Big Bazaar", sector: "FMCG" },
  { name: "Government of Bihar", sector: "Government", location: "Patna" },
  { name: "Indian Army", sector: "Government" },
  { name: "Birla School", sector: "Education" },
  { name: "CIMP", sector: "Education", location: "Patna" },
  { name: "CRI Pumps", sector: "Manufacturing" },
  { name: "Canara Bank", sector: "Finance" },
  { name: "Coca-Cola", sector: "FMCG" },
  { name: "DMRC", sector: "Government", location: "New Delhi" },
  { name: "Dalmia Bharat Cement", sector: "Manufacturing" },
  { name: "Essel Utilities", sector: "Energy" },
  { name: "FHI 360", sector: "NGO / UN" },
  { name: "Franklin Templeton Investments", sector: "Finance" },
  { name: "D. Goenka School", sector: "Education" },
  { name: "Government of India", sector: "Government" },
  { name: "HDFC", sector: "Finance" },
  { name: "HelpAge India", sector: "NGO / UN" },
  { name: "Hyundai", sector: "Automotive" },
  { name: "IDBI Bank", sector: "Finance" },
  { name: "ITC Limited", sector: "FMCG" },
  { name: "Income Tax Department", sector: "Government" },
  { name: "Indian Bank", sector: "Finance" },
  { name: "IndianOil", sector: "Energy" },
  { name: "Amara Raja", sector: "Manufacturing" },
  { name: "JSW", sector: "Manufacturing" },
  { name: "Janalakshmi", sector: "Finance" },
  { name: "L&T", sector: "Manufacturing" },
  { name: "Maruti Suzuki", sector: "Automotive" },
  { name: "NTPC", sector: "Energy" },
  { name: "NABARD", sector: "Finance" },
  { name: "SAIL", sector: "Manufacturing" },
  { name: "State Bank of India", sector: "Finance" },
  { name: "SITI Networks", sector: "Telecom" },
  { name: "Shriram", sector: "Finance" },
  { name: "Sonalika International", sector: "Manufacturing" },
  { name: "Survey of India", sector: "Government" },
  { name: "Syndicate Bank", sector: "Finance" },
  { name: "Tata Steel", sector: "Manufacturing" },
  { name: "Tata Motors", sector: "Automotive" },
  { name: "Titan", sector: "Manufacturing", location: "Patna, Bihar" },
  { name: "TVS Group", sector: "Automotive" },
  { name: "United Nations", sector: "NGO / UN" },
  { name: "Usha International", sector: "Manufacturing", location: "New Delhi" },
  { name: "Ujjivan Small Finance Bank", sector: "Finance" },
  { name: "UNICEF", sector: "NGO / UN" },
  { name: "United Spirits", sector: "FMCG" },
  { name: "Vodafone", sector: "Telecom" },
  { name: "World Health Organization", sector: "NGO / UN" },
  { name: "ZTE", sector: "Telecom" },
];

/** @deprecated Use CLIENTS_PAGE_CLIENTS */
export const PROJECTS_PAGE_CLIENTS = CLIENTS_PAGE_CLIENTS;

export type ClientsSectorSummary = { sector: string; count: number };

export function groupClientsBySector(
  clients: readonly ClientBadgeData[],
): ClientsSectorSummary[] {
  const counts = new Map<string, number>();
  for (const client of clients) {
    counts.set(client.sector, (counts.get(client.sector) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([sector, count]) => ({ sector, count }))
    .sort((left, right) => right.count - left.count || left.sector.localeCompare(right.sector));
}

export const CLIENTS_WORK = [
  {
    id: "titan",
    folder: "Titan",
    name: "Titan",
    location: "Patna, Bihar",
    summary: "Collaborative office zones with modular seating and meeting layouts.",
  },
  {
    id: "tvs",
    folder: "TVS",
    name: "TVS",
    location: "Patna, Bihar",
    summary: "Workspace planning across leadership cabins, desking, and collaboration bays.",
  },
  {
    id: "usha",
    folder: "Usha",
    name: "Usha",
    location: "Patna, Bihar",
    summary: "End-to-end supply and on-site setup with execution-ready furniture systems.",
  },
  {
    id: "dmrc",
    folder: "DMRC",
    name: "DMRC",
    location: "New Delhi",
    summary: "Operational office furniture delivery built for high-use enterprise teams.",
  },
  {
    id: "franklin-templeton",
    folder: "FranklinTempleton",
    name: "Franklin Templeton",
    location: "India",
    summary: "Formal workspace setups with consistent finishes and executive-ready detailing.",
  },
  {
    id: "government",
    folder: "Govenment",
    name: "Government",
    location: "Patna, Bihar",
    summary: "Durable institutional deployments with practical day-to-day usability.",
  },
] as const;

export const SHOWROOMS_PAGE_COPY = {
  heroTitle: "Showrooms",
  heroKicker: "Showroom",
  heroTitleLead: "Visit",
  heroTitleAccent: "us.",
  heroSubtitle: "Hours, directions, and signature deliveries from our showroom space.",
  craftQuote:
    "See seating, finishes, and systems in context — then brief the planning team with clarity.",
  craftAttribution: "Jagat Trade Centre · Frazer Road",
  trustedKicker: "Trusted at a glance",
  aboutKicker: "About us",
  aboutTitle: "Clear planning, reliable supply.",
  aboutDescription:
    "Defined scope, practical timelines, and strong after-sales support.",
  clientsKicker: "Clients",
  clientsCta: "View full client list",
  highlightsKicker: "Signature work",
  highlightsTitle: "Recent deliveries",
  highlightsCta: "Explore client work",
  visitKicker: "Plan your visit",
  visitTitle: "Showroom details",
  visitCta: "Plan a visit",
  visitRows: [
    {
      kind: "address" as const,
      title: "401, Jagat Trade Centre",
      detail: "Frazer Road, Patna, Bihar 800001",
    },
    {
      kind: "hours" as const,
      title: "Monday – Saturday",
      detail: "Contact the team before your visit",
    },
    {
      kind: "phone" as const,
      title: "+91 90310 22875",
      detail: "Support and showroom enquiries",
    },
  ],
  ctaKicker: "Next step",
  ctaTitleLead: "Visit or",
  ctaTitleAccent: "plan ahead.",
  ctaDescription:
    "Book a showroom conversation or start a planning call when layout still needs alignment.",
  ctaPrimary: "Contact the team",
  ctaSecondary: "Request planning call",
  sustainabilityTitle: "Designed responsibly, delivered practically.",
  sustainabilitySubtitle: "Sustainability",
  sustainabilityDescription:
    "From material choices to long-life product planning, we focus on workspace systems that reduce waste and improve lifecycle value.",
  sustainabilityCta: "Read sustainability commitments",
} as const;

export const SHOWROOMS_CLIENTS = [
  "DMRC",
  "Tata Steel",
  "HDFC",
  "IndianOil",
  "L&T",
  "NTPC",
  "Titan",
  "Bihar Tourism",
] as const;

export const SHOWROOMS_HIGHLIGHTS = [
  {
    title: "DMRC Offices",
    detail: "Workspace systems delivered with phase-wise planning and installation handover.",
  },
  {
    title: "Titan Patna HQ",
    detail: "Ergonomic seating and workstation deployment aligned to team-level needs.",
  },
  {
    title: "Enterprise Fit-outs",
    detail: "Turnkey planning, supply, and execution for large office and institutional spaces.",
  },
] as const;

export const SOLUTIONS_PAGE_COPY = {
  metadataTitle: "Workspace Solutions",
  metadataDescription:
    "Workplace furniture solutions for focus, collaboration, meetings, storage, and education.",
  heroTitle: "Solutions",
  heroTitleLead: "Built for",
  heroTitleAccent: "how teams work.",
  heroSubtitle: "Furniture, planning, and delivery for complete workplaces.",
  heroBackgroundImage: "/assets/marketing/hero/pages/about-oneandonly-bright.webp",
  categoriesTitleLead: "Browse",
  categoriesTitleAccent: "solutions",
  deliveryKicker: "Delivery",
  deliveryTitle: "Predictable delivery",
  deliveryDescription: "Clear scope, practical planning, and accountable install.",
  deliveryMedia: {
    src: "/assets/marketing/clients/DMRC/dmrc-1.webp",
    alt: "Workspace planning and delivery",
  },
  stats: [
    { value: "14+", label: "Years in workspace projects" },
    { value: "120+", label: "Projects delivered" },
    { value: "120+", label: "Client organizations served" },
    { value: "20+", label: "Cities supported" },
  ],
  phaseLabelTemplate: "Phase {number}",
  planningKicker: "Start planning",
  planningTitle: "Discuss your brief",
  planningDescription: "Site details, timelines, and seat count — a practical path.",
  planningPrimaryCta: "Planning call",
  planningSecondaryCta: "Browse products",
  planningTertiaryCta: "Resource Desk",
  planningCtas: [
    { label: "Planning call", href: "/contact", variant: "primary" },
    { label: "Browse products", href: "/products", variant: "outline" },
    { label: "Resource Desk", href: "/downloads", variant: "outline" },
  ],
} as const;

export const SUSTAINABILITY_PAGE_COPY = {
  heroKicker: "Sustainability",
  heroTitle: "Sustainability",
  heroTitleLead: "Built for",
  heroTitleAccent: "long life.",
  heroSubtitle: "Durable systems, practical materials, less rework.",
  heroCta: "Browse products",
  craftQuote:
    "Long-life workspaces start with honest material choices — maintainable, repairable, and specified for real use.",
  craftAttribution: "Specification perspective, One&Only planning",
  introTitleLead: "Our approach for ",
  introTitleEmphasis: "long-life workspaces.",
  introDescription:
    "Material choice, maintainability, and planning discipline from spec to after-sales.",
  introKicker: "Approach",
  introTitle: "Long-life systems",
  introTitleLeadShort: "Long-life",
  introTitleAccent: "systems",
  introPoints: [
    "Durable categories and replaceable components reduce early replacement.",
    "Materials and transport choices tied to real use — not empty claims.",
    "No unsupported certifications or metrics without evidence.",
  ],
  productsCta: "Browse products",
  pillars: [
    {
      title: "Materials",
      detail: "Clearer material data and service-life fit per use case.",
      icon: "leaf",
    },
    {
      title: "Repair first",
      detail: "Maintain, repair, or reconfigure instead of replace early.",
      icon: "recycle",
    },
    {
      title: "Less waste",
      detail: "Quantity planning and fit checks cut returns and rework.",
      icon: "lightbulb",
    },
  ],
  ecoScoreTitle: "Our Eco-Score System",
  ecoScoreDescription:
    "Where score data is available, Eco-Score (1 to 10) is used as a directional planning signal alongside specifications and use-case fit.",
  ecoScoreItems: [
    {
      index: "1",
      title: "Materials",
      detail:
        "Material composition, recycled-content signals, and durability-related fit where data is available.",
    },
    {
      index: "2",
      title: "Manufacturing",
      detail:
        "Manufacturing and sourcing context captured in current product records or partner documentation.",
    },
    {
      index: "3",
      title: "Longevity",
      detail:
        "Expected service life, maintenance practicality, and replacement risk in active use.",
    },
  ],
  badges: [
    {
      title: "Eco-Score: 8+",
      detail:
        "Higher-scoring products generally show stronger lifecycle signals in the current catalog data.",
    },
    {
      title: "Eco-Score: 5-7",
      detail:
        "Mid-range scores indicate partial sustainability signals and should be reviewed with full technical context.",
    },
  ],
  verifiedTitle: "Sustainability signals",
  verifiedDescription:
    "We present catalog-backed sustainability signals and avoid unsupported certification or impact claims.",
  verifiedLabels: ["Catalog-backed", "Data reviewed", "Long-life focus"],
  commitmentsKicker: "What we prioritize",
  commitmentsTitle: "Practical commitments over generic claims.",
  commitments: [
    {
      title: "Long service life",
      detail:
        "Products and layouts should stay usable longer so teams do not replace fit-outs prematurely.",
    },
    {
      title: "Responsible specification",
      detail:
        "We prefer materials and product structures that balance durability, maintenance, and lower environmental impact.",
    },
    {
      title: "Planning efficiency",
      detail:
        "Better upfront planning reduces rework, mismatch, and waste during delivery and installation.",
    },
  ],
  routeNoteTitle: "Need sustainability information for a live project?",
  routeNoteDescription:
    "Ask for the current product pack or planning support when you need material guidance, category recommendations, or project-fit clarification.",
  routeNotePrimaryCta: "Open Resource Desk",
  routeNoteSecondaryCta: "Request planning call",
  ctaKicker: "Next step",
  ctaTitleLead: "Plan with",
  ctaTitleAccent: "long-life intent.",
  ctaDescription:
    "Browse the catalog, open Resource Desk, or request a planning call for material guidance on a live brief.",
  ctaPrimary: "Browse products",
  ctaSecondary: "Contact the team",
} as const;

export const CAREER_PAGE_COPY = {
  heroTitle: "Careers",
  heroKicker: "Join the team",
  heroTitleLead: "Careers",
  heroTitleAccent: "with us.",
  heroSubtitle:
    "Sales, planning, operations, and support for commercial projects across India.",
  craftQuote:
    "Real client briefs, measured ownership, and teams that stay close to delivery.",
  craftAttribution: "People · One&Only",
  introKicker: "Why join us",
  introTitle: "Build in office furniture delivery.",
  introDescription:
    "Planning, product consulting, delivery, and after-sales for enterprise workplaces — with clear accountability and mentorship.",
  pillars: [
    {
      title: "Collaborative teams",
      detail:
        "Sales, planning, and operations work closely so decisions are clear and execution stays fast.",
      icon: "users",
    },
    {
      title: "Learning-focused work",
      detail:
        "You gain practical exposure to real client briefs, procurement cycles, and installation realities.",
      icon: "graduation-cap",
    },
    {
      title: "Meaningful responsibility",
      detail:
        "We give ownership early, with mentorship and clear accountability standards.",
      icon: "briefcase",
    },
  ],
  openingsTitle: "Current openings",
  openingsAvailableTemplate: "{count} roles available",
  processKicker: "How careers grow",
  processTitle: "Close to real projects and real ownership.",
  processDescription:
    "Roles stay connected to client outcomes — not isolated internal handoffs.",
  processSteps: [
    {
      title: "Client-facing learning",
      detail:
        "You learn from active workspace briefs, approvals, and on-ground delivery realities instead of only internal training material.",
    },
    {
      title: "Cross-functional exposure",
      detail:
        "Sales, planning, operations, and support stay close enough for faster decisions and clearer accountability.",
    },
    {
      title: "Measured ownership",
      detail:
        "Responsibility increases with performance, but expectations stay explicit around response quality, execution, and professionalism.",
    },
  ],
  fallbackTitle: "No matching role yet?",
  fallbackDescription:
    "Send your profile and let us know where you can contribute. We review applications for sales, operations, planning, and support functions on a rolling basis.",
  careersEmail: "careers@oando.co.in",
  supportTitle: "Not sure which role fits your background?",
  supportDescription:
    "Send a short note with your experience area and preferred function. We can route you toward the most relevant planning, sales, operations, or support lane.",
  supportPrimaryCta: "Contact the team",
  supportSecondaryCta: "Open planning page",
  ctaKicker: "Not sure where you fit?",
  ctaTitleLead: "Talk to",
  ctaTitleAccent: "the team.",
  ctaDescription:
    "Share your background — we'll route you to the right planning, sales, operations, or support lane.",
  ctaPrimary: "Contact the team",
  ctaSecondary: "Open planning page",
  applyCta: "Apply",
} as const;

export const CAREER_PAGE_JOBS = [
  {
    title: "Project Sales Manager",
    department: "Enterprise Sales",
    location: "India (multi-city)",
  },
  {
    title: "Workspace Planner",
    department: "Planning and Design",
    location: "India",
  },
  {
    title: "Site Execution Coordinator",
    department: "Operations",
    location: "India — travel",
  },
  {
    title: "Customer Support Executive",
    department: "After-sales Support",
    location: "India",
  },
] as const;

export const PLANNING_PAGE_COPY = {
  heroTitle: "Planning Service",
  heroKicker: "Workspace planning",
  heroTitleLead: "From intent",
  heroTitleAccent: "to install-ready.",
  heroSubtitle:
    "Workspace planning that balances workflow, budget, and execution timelines.",
  craftQuote:
    "Good planning removes guesswork — layout, categories, and BOQ aligned before procurement starts.",
  craftAttribution: "Planning desk · One&Only",
  workflowKicker: "Planning workflow",
  workflowTitle: "From intent to implementation-ready plans.",
  deliverablesKicker: "What you receive",
  deliverablesTitle: "Clear deliverables your team can execute.",
  bestForKicker: "Best for",
  bestForDescription:
    "New offices, floor expansions, workspace modernization, and enterprise fit-outs where planning quality directly impacts cost and timeline.",
  deskKicker: "Support inputs",
  deskTitle: "Bring documents, plans, and product questions into one workflow.",
  deskDescription:
    "If your team needs category packs, technical sheets, or layout references before the planning call, start at the Resource Desk and we will route the right material into the same discussion.",
  primaryCta: "Request planning call",
  secondaryCta: "View products",
  plannerCta: "Open Oando Planner",
  tertiaryCta: "Open Resource Desk",
} as const;

export const PLANNING_PAGE_STEPS = [
  {
    title: "Discovery and brief alignment",
    detail:
      "We map team structure, workflow patterns, budget constraints, and approval checkpoints before design begins.",
  },
  {
    title: "Layout and specification",
    detail:
      "Our team develops 2D/3D concepts and furniture specifications tailored to headcount, zoning, and performance targets.",
  },
  {
    title: "Execution readiness",
    detail:
      "You receive BOQ-ready documentation, phased implementation options, and a clear handover plan for procurement and fit-out teams.",
  },
] as const;

export const PLANNING_PAGE_DELIVERABLES = [
  "Workplace planning workshop",
  "Space zoning and furniture layout",
  "Category-wise furniture recommendations",
  "Budget-aligned BOQ draft",
  "Implementation roadmap",
] as const;

export const SERVICE_PAGE_COPY = {
  heroTitle: "Service",
  heroKicker: "After install",
  heroTitleLead: "Service",
  heroTitleAccent: "& support.",
  heroSubtitle: "Install, warranty, and care — one team after handover.",
  craftQuote:
    "Support that starts at install and stays through warranty — clear routing, accountable follow-through.",
  craftAttribution: "Service desk · One&Only",
  frameworkKicker: "Framework",
  frameworkTitle: "One partner after install",
  channelsKicker: "Channels",
  channelsTitle: "Reach support",
  supportKicker: "Need help now?",
  supportDescription:
    "Share a project reference and issue summary — we route to the right specialist.",
  supportDeskKicker: "Documents first?",
  supportDeskTitle: "Resource Desk",
  supportDeskDescription:
    "Packs, technical sheets, warranty references, and planning records.",
  primaryCta: "Support request",
  secondaryCta: "Track order",
  tertiaryCta: "Resource Desk",
  ctaKicker: "Next step",
  ctaTitleLead: "Talk to",
  ctaTitleAccent: "support.",
  ctaDescription:
    "Request help, track an order, or open Resource Desk for documentation.",
} as const;

export const SERVICE_PAGE_PILLARS = [
  {
    title: "Installation",
    detail: "On-site assembly, placement, and functional checks.",
  },
  {
    title: "Warranty",
    detail: "Claims, replacements, and corrective service with clear tracking.",
  },
  {
    title: "Care",
    detail: "Inspection and maintenance guidance for long-term performance.",
  },
] as const;

export const SERVICE_PAGE_CHANNELS = [
  {
    label: "Phone support",
    kind: "supportPhone",
  },
  {
    label: "Email support",
    kind: "salesEmail",
  },
  {
    label: "WhatsApp support",
    kind: "whatsapp",
    value: "Start chat",
    href: buildWhatsAppHref(
      "Hi, I need support for an installed workspace project.",
    ),
  },
] as const;

export const DOWNLOADS_PAGE_COPY = {
  metadataTitle: "Resource Desk",
  metadataDescription:
    "Request product catalogs, technical sheets, and planning references tailored to your workspace brief.",
  heroKicker: "Resource Desk",
  heroTitle: "Resource Desk",
  heroTitleLead: "Documentation routed to",
  heroTitleAccent: "your brief",
  heroSubtitle:
    "Request the right product packs, technical sheets, and planning references for your workspace brief.",
  heroPrimaryCta: "Request a documentation pack",
  resourceKicker: "Resource routing",
  resourceTitle: "Tell us what you are planning and we will send the right documentation pack.",
  resourceDescription:
    "Our catalog keeps evolving across categories, finishes, and planning requirements. Instead of serving stale public downloads, we route each request to the latest pack for your project scope.",
  processKicker: "How it works",
  processTitle: "A request-based desk built for active projects.",
  processSteps: [
    {
      title: "Share your workspace brief",
      detail: "Tell us the categories, seat count, city, and timeline so we can match the right product set.",
    },
    {
      title: "We curate the latest pack",
      detail: "Our team sends current catalogs, technical sheets, and planning references that fit your requirement.",
    },
    {
      title: "Review with planning support",
      detail: "If needed, we help narrow options, clarify specifications, and connect the files to your layout or BOQ discussion.",
    },
  ],
  noteTitle: "What you can request",
  noteBody:
    "Request packs may include category catalogs, technical sheets, planning references, finish options, warranty details, and model-specific support documents where available.",
  notePoints: [
    "Product catalogs grouped by category and use case",
    "Technical sheets with dimensions, materials, and warranty guidance",
    "Planning references for workstation density, layouts, and execution flow",
  ],
  urgentKicker: "Need a quick response?",
  urgentDescription:
    "Send your requirement and the categories you need. We will reply with the latest available pack and the right follow-up contact for your project.",
  primaryCta: "Request a documentation pack",
  secondaryCta: "Email the sales desk",
  tertiaryCta: "Talk on WhatsApp",
  ctaKicker: "Documentation follow-through",
  ctaTitleLead: "Ready for the",
  ctaTitleAccent: "right pack",
  ctaDescription:
    "Share categories, seat count, and city — we reply with current catalogs, sheets, and the next planning contact.",
} as const;

export const DOWNLOADS_RESOURCE_CATEGORIES = [
  {
    title: "Product catalogs",
    detail: "Collection overviews, category snapshots, and recommended product mixes.",
    cta: "Request catalog pack",
    href: "/contact",
  },
  {
    title: "Technical sheets",
    detail: "Material specifications, dimensions, warranty terms, and usage guidance.",
    cta: "Request technical sheets",
    href: "/contact",
  },
  {
    title: "Planning references",
    detail: "Layout examples, workstation densities, and execution best practices.",
    cta: "Request planning references",
    href: "/planning",
  },
] as const;

export const LEGAL_PAGE_COPY = {
  privacy: {
    title: "Privacy Policy",
    heroSubtitle:
      "How we handle enquiry data, attribution cookies, and communication records across planning, sales, and support flows.",
    overviewKicker: "Privacy and consent",
    overviewTitle: "A practical privacy policy for active workspace enquiries.",
    overviewDescription:
      "We collect only the information needed to respond to project requests, route support conversations, and maintain service records around active client relationships.",
    intro: [
      "One&Only is operated by One and Only Furniture Private Limited (\"OOFPL\"). This policy explains what personal data we collect, how we use it, and what cookies we set when you browse our website or submit an enquiry.",
      "Personal information includes data that can identify or contact you, such as your name, company, email address, phone number, IP address, and any enquiry details you share through our forms.",
    ],
    commitmentsTitle: "What this policy covers",
    commitments: [
      "What information we collect when you browse, enquire, or request support.",
      "How we use submitted information for routing, follow-up, and service quality.",
      "Which cookies support consent storage and attribution reporting.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    heroSubtitle:
      "Website, enquiry, quotation, delivery, warranty, and support terms for One&Only office furniture across India.",
    overviewKicker: "Commercial terms",
    overviewTitle: "The operating terms behind quotations, orders, delivery, and support.",
    overviewDescription:
      "These terms explain how website information, commercial quotations, project execution, and warranty-backed support are handled in practice. Company identity and registered office details are included here (imprint retired).",
    sections: [
      {
        heading: "General Terms and Conditions",
        body: "These Terms and Conditions govern the use of this website and all commercial dealings with One&Only, including product enquiries, quotations, supply, and support services.",
      },
      {
        heading: "1. Scope",
        body: "These terms apply to all business relationships with customers, subject to any project-specific written agreement executed between both parties.",
      },
      {
        heading: "2. Quotations and acceptance",
        body: "Product and service information on this website is informational. A binding transaction occurs only after written quote acceptance and order confirmation.",
      },
      {
        heading: "3. Delivery and installation",
        body: "Delivery schedules are shared at order confirmation and may vary by project scope, site readiness, and material availability.",
      },
      {
        heading: "4. Warranty and support",
        body: "Warranty applicability follows the specific product line and agreed terms. Service and support requests are handled through our official channels.",
      },
      {
        heading: "5. Liability",
        body: "Liability is limited to the extent permitted by law and the value or terms agreed in the corresponding commercial contract.",
      },
    ],
  },
  imprint: {
    title: "Imprint",
    heroSubtitle:
      "Business identity, representative details, and official contact information for One&Only.",
    overviewKicker: "Business information",
    overviewTitle: "Official company and contact details.",
    overviewDescription:
      "Use this page when you need legal business identification, the official office address, or the named management and contact lines behind the website.",
    sections: [
      {
        heading: "Legal Information",
        lines: ["One and Only Furniture", "401, Jagat Trade Centre", "Frazer Road", "Patna - 800 001, Bihar", "India"],
      },
      {
        heading: "Represented by",
        lines: ["Management: Arvind Kumar Singh"],
      },
      {
        heading: "Contact",
        lines: ["Phone: +91 90310 22875", "Email: sales@oando.co.in"],
      },
      {
        heading: "Business Identification",
        lines: ["Authorized Dealer for leading office furniture brands.", "Registered in Patna, Bihar."],
      },
    ],
  },
  refund: {
    metadataTitle: "Refund and Return Policy",
    metadataDescription: "Refund, return, replacement, and cancellation policy for One&Only.",
    heroTitle: "Refund and return policy",
    heroSubtitle: "Terms for returns, replacements, cancellations, and refunds.",
    overviewKicker: "Returns and replacement terms",
    overviewTitle: "Clear guidance for damaged goods, cancellation windows, and refund eligibility.",
    overviewDescription:
      "This policy sets the expectations for product damage reporting, replacement handling, cancellation timing, and the conditions under which refunds are processed.",
    sections: [
      {
        title: "General policy",
        tone: "white",
        items: [
          "Change requests are not accepted after delivery is completed, except for damaged or defective products.",
          "Exchanges are only provided for products that arrive damaged or defective.",
          "Product images on the website are representational and a few features may vary on the final product.",
          "Cancellation is allowed before shipment. Discounted purchases are not eligible for cancellation.",
        ],
      },
      {
        title: "Damaged or defective products",
        tone: "soft",
        items: [
          "Report damage within 24 hours of delivery by email with product photos.",
          "Contact: sales@oando.co.in",
          "Reverse pickup and replacement for damaged product cases are arranged by our team.",
          "Replaceable faulty parts are usually arranged within 7 days; full replacement can take up to 15 days depending on availability.",
        ],
      },
      {
        title: "Returns and refunds",
        tone: "white",
        items: [
          "Returns are accepted only when products are damaged on arrival.",
          "Refund is issued only if replacement or replacement parts are not available for the same product.",
          "For non-damage refund requests, repackaging and transport charges may apply.",
          "Refunds are processed via NEFT or back to the original payment method, usually within 7 working days.",
        ],
      },
      {
        title: "How to initiate return or cancellation",
        tone: "soft",
        items: [],
        contactLines: [
          "Email: sales@oando.co.in",
          "Phone: +91 90310 22875",
          "Corporate Office: 401, Jagat Trade Centre, Frazer Road, Patna - 800 001, Bihar, India",
        ],
      },
    ],
  },
} as const;

export const PRODUCTS_PAGE_COPY = {
  heroSubtitle:
    "Furniture categories built for real office workflows, long-term durability, and scalable growth.",
  headlineLead: "Built to",
  headlineAccent: "Perform.",
  pillars: [
    {
      title: "Specification-led guidance",
      detail:
        "We map headcount, usage patterns, and budget so product choices are practical from day one.",
      icon: "check-circle",
    },
    {
      title: "Reliable timelines",
      detail:
        "Modular categories and structured planning help teams move from approval to installation with control.",
      icon: "clock",
    },
    {
      title: "After-sales confidence",
      detail:
        "Warranty coverage and service support are built into every proposal, not handled as an afterthought.",
      icon: "shield",
    },
  ],
} as const;

export const CATEGORY_ROUTE_COPY = {
  metadataSuffix: "One&Only",
  metadataTail: "Browse our full range of {category} for practical office planning and delivery.",
  browseAllCta: "Browse all categories",
  resourceDeskCta: "Open Resource Desk",
  compareIdleLabel: "Select up to 4 products to compare",
  compareIdleLabelShort: "Compare",
  compareActiveLabelShort: "Compare ({count})",
  compareActiveLabel: "Compare {count} selected",
  pricingFallback: "Pricing shared on request",
  pricingBandSuffix: "price band",
  filterSummaryTitle: "Filter the current category",
  filterSummaryDescription:
    "Use a few focused filters to narrow the list, then compare or request the right options.",
  activeFiltersLabel: "Active filters",
  activeSearchLabel: "Search",
  activeCountLabel: "{count} active",
  clearFiltersCta: "Clear all",
  resultsSummaryLabel: "{shown} of {total} products",
  drawerResultsCta: "View {count} results",
  drawerResultsHint: "Filters update the current category only.",
  filterFallbackMessage:
    "Live filter sync is temporarily unavailable. Showing the current category snapshot instead.",
  emptyTitle: "No products match this filter set",
  emptyDescription:
    "Clear filters, adjust your search, or return to the full category list.",
  emptyPrimaryCta: "Clear all filters",
  emptySecondaryCta: "Browse all categories",
  emptyCategoryTitle: "No products are published in this category yet",
  emptyCategoryDescription:
    "This category has no published products right now. Browse other categories or contact us for current availability.",
  emptyCategoryPrimaryCta: "Browse all categories",
  emptyCategorySecondaryCta: "Contact us",
  errorTitle: "We couldn't load this category",
  errorDescription:
    "Something went wrong loading these products. Please refresh the page or try again shortly.",
  offlineTitle: "Workspace product catalog temporarily unavailable",
  offlineDescription:
    "Product data is temporarily unavailable while the catalog reconnects. Please try again shortly.",
  offlinePrimaryCta: "Contact us",
  offlineSecondaryCta: "Back to home",
} as const;

export const COMPARE_ROUTE_COPY = {
  kicker: "Compare office furniture",
  title: "Compare selected workspace options",
  /** Always shown as H2 (empty and populated shortlist). */
  bodyHeading: "Specification review",
  bodyPopulatedHint: "Read the shortlist side by side.",
  description:
    "Compare up to four office furniture products — category, materials, warranty, certification, and features — before you request a quote or BOQ. Built for shortlists across India.",
  countLabel: "Comparing {count} products",
  mobileHint: "Swipe horizontally on smaller screens to read every specification column.",
  browseCta: "Browse products",
  resourceDeskCta: "Open Resource Desk",
  primaryCta: "Request quote",
  viewProductCta: "View product",
  addToQuoteCta: "Add to quote cart",
  emptyTitle: "Your comparison shortlist is empty",
  emptyDescription:
    "Add up to 4 products from product or category pages (use Compare on each card). Return here to review materials, warranty, and features side by side before planning or quote.",
  emptyPrimaryCta: "Browse products",
  emptySecondaryCta: "Open Resource Desk",
  emptyPlannerCta: "Open guest planner",
  emptyShortlistKicker: "Empty shortlist",
  emptySteps: [
    "Select up to 4 office furniture products",
    "Review materials, warranty, and features",
    "Request quote or continue to planner",
  ],
  jumpCategoryLabel: "Jump into a category",
  selectionStatusLabel: "Selection status",
  specColumnLabel: "Specification",
  tableCaption: "Side-by-side specification comparison of selected office furniture products",
  selectionEmptyHint:
    "Add products from category or product pages to build this comparison. Your shortlist syncs when you open Compare from the dock.",
  ctaKicker: "Next commercial step",
  ctaTitle: "Move from shortlist to quote or planning",
  ctaDescription:
    "Request a quote with this comparison in mind, or open the Resource Desk when documentation is the next blocker.",
} as const;

export const QUOTE_CART_ROUTE_COPY = {
  kicker: "Quote cart",
  title: "Quote cart built for procurement follow-through.",
  description:
    "Keep shortlisted products, quantities, and the next planning or documentation step together before you contact sales.",
  browseCta: "Browse products",
  compareCta: "Compare selected",
  resourceDeskCta: "Open Resource Desk",
  planningCta: "Request planning call",
  primaryCta: "Submit quote request",
  summaryTitle: "Request summary",
  summaryDescription:
    "Use the quote lane when the shortlist is ready, Planning when the layout still needs work, and the Resource Desk when documentation is the next blocker.",
  summaryQuantityLabel: "Selected quantity",
  summaryProductsLabel: "Unique products",
  summaryCompareHint: "Need a side-by-side review first?",
  summaryDeskHint: "Need packs, technical sheets, or warranty references?",
  emptyTitle: "Your quote cart is empty.",
  emptyDescription:
    "Add products from category or product pages to keep procurement options together before you request pricing or documentation.",
  emptyPrimaryCta: "Browse products",
  emptySecondaryCta: "Open Resource Desk",
  clearCta: "Clear all",
  removeCta: "Remove",
} as const;

export const PDP_ROUTE_COPY = {
  fallbackDescription: "{name} from One&Only.",
  productBrand: "One&Only",
  summary: {
    title: "Decision snapshot",
    description:
      "Review the core fit, configuration, and support signals before you request a quote or documentation pack.",
    visualCoverage: "{count} verified images",
    galleryOnly: "Image gallery available",
    modelReady: "3D / AR ready",
    modelConditional: "3D by model",
    bestFor: "Best for",
    dimensions: "Dimensions",
    materials: "Materials",
    supportTitle: "Planning and documentation support",
    supportDescription:
      "Use Planning for layout guidance and the Resource Desk for technical sheets, finish options, and category packs where available.",
    supportQuote: "Add this model to your quote cart to keep procurement options together.",
    supportPlanning: "Use Planning when seat count, layout density, or workstation mix still needs work.",
    supportResources:
      "Use the Resource Desk when your team needs technical sheets, finish references, or documentation support.",
    useCases: "Best-fit spaces",
  },
  trustBadges: {
    madeInIndia: "Made in India",
    madeInIndiaDescription: "Local manufacturing details are shared by model where available.",
    certificationFallback: "Certification details by model",
    certificationDescription: "Certification details are shown where provided.",
    warrantyDescription: "Warranty terms vary by model and proposal.",
  },
  ctas: {
    addToQuote: "Add to Quote Cart",
    addToCompare: "Add To Compare",
    addedToCompare: "Added To Compare",
    requestQuote: "Request Quote",
    designInPlanner: "Design in Planner",
    consultation: "Book a Consultation",
    planning: "Open Planning Service",
    resourceDesk: "Open Resource Desk",
    returnToResults: "Return to filtered results",
    returnToCategory: "Back to category",
    copyLink: "Copy Link",
    configuration: "Configuration",
    specifications: "Specifications",
    keyFeatures: "Key Features",
    technicalDetails: "Technical Details",
    materialOptions: "Material Options",
    modelUnavailable: "3D model currently unavailable for this product.",
    modelChecking: "Checking 3D model availability...",
    viewImage: "View Image",
    view3d: "View in 3D/AR",
  },
} as const;

