/**
 * One-shot export of marketing copy objects for i18n scaffold (Phase 4a).
 * Run: npx tsx scripts/lib/exportMarketingCopy.ts
 */
import {
  ABOUT_PAGE_COPY,
  CAREER_PAGE_COPY,
  CONTACT_PAGE_COPY,
  DOWNLOADS_PAGE_COPY,
  LEGAL_PAGE_COPY,
  PLANNING_PAGE_COPY,
  PRODUCTS_PAGE_COPY,
  PROJECTS_PAGE_COPY,
  SERVICE_PAGE_COPY,
  SHOWROOMS_PAGE_COPY,
  SOLUTIONS_PAGE_COPY,
  SUSTAINABILITY_PAGE_COPY,
  TRUSTED_BY_PAGE_COPY,
} from "../../site/features/site/data/routeCopy";
import {
  HOMEPAGE_BRAND_STATEMENT_CONTENT,
  HOMEPAGE_COLLECTIONS_CONTENT,
  HOMEPAGE_HERO_CONTENT,
  HOMEPAGE_PLANNER_SUITE_CONTENT,
  HOMEPAGE_SHOWCASE_CONTENT,
  HOMEPAGE_TRUST_CONTENT,
  HOMEPAGE_WHY_CHOOSE_US_CONTENT,
} from "../../site/features/site/data/homepage";

const marketing = {
  about: ABOUT_PAGE_COPY,
  legal: LEGAL_PAGE_COPY,
  solutions: SOLUTIONS_PAGE_COPY,
  contact: CONTACT_PAGE_COPY,
  products: PRODUCTS_PAGE_COPY,
  career: CAREER_PAGE_COPY,
  downloads: DOWNLOADS_PAGE_COPY,
  planning: PLANNING_PAGE_COPY,
  projects: PROJECTS_PAGE_COPY,
  service: SERVICE_PAGE_COPY,
  showrooms: SHOWROOMS_PAGE_COPY,
  sustainability: SUSTAINABILITY_PAGE_COPY,
  trustedBy: TRUSTED_BY_PAGE_COPY,
  home: {
    hero: HOMEPAGE_HERO_CONTENT,
    plannerSuite: HOMEPAGE_PLANNER_SUITE_CONTENT,
    trust: HOMEPAGE_TRUST_CONTENT,
    brandStatement: HOMEPAGE_BRAND_STATEMENT_CONTENT,
    collections: HOMEPAGE_COLLECTIONS_CONTENT,
    whyChooseUs: HOMEPAGE_WHY_CHOOSE_US_CONTENT,
    showcase: HOMEPAGE_SHOWCASE_CONTENT,
  },
};

process.stdout.write(`${JSON.stringify(marketing, null, 2)}\n`);
