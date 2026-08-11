import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW_PREFIXES } from "@/features/site/data/routeClassification";
import { SITE_URL } from "@/lib/siteUrl";

const BASE_URL = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  const disallow = [...ROBOTS_DISALLOW_PREFIXES];
  const sitemapHost = BASE_URL.replace(/\/+$/, "");
  // Explicit major crawlers (same rules) — helps Bing/Google discover allow/disallow cleanly.
  const crawlers = ["*", "Googlebot", "Bingbot", "Googlebot-Image"] as const;

  return {
    rules: crawlers.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow,
    })),
    host: sitemapHost,
    sitemap: [`${sitemapHost}/sitemap.xml`],
  };
}