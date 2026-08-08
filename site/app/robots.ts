import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW_PREFIXES } from "@/features/site/data/routeClassification";
import { SITE_URL } from "@/lib/siteUrl";

const BASE_URL = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...ROBOTS_DISALLOW_PREFIXES],
      },
    ],
    sitemap: [`${BASE_URL.replace(/\/+$/, "")}/sitemap.xml`],
    host: BASE_URL.replace(/\/+$/, ""),
  };
}