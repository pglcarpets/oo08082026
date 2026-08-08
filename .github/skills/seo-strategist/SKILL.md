---
name: seo-strategist
description: Search engine optimization (SEO), metadata, JSON-LD structured data, dynamic sitemaps, and Open Graph tags. Trigger when optimizing web pages for search indexing, social sharing, or web crawlers.
---

# SEO & Metadata Strategist Skill Instructions

When configuring search engine optimization, metadata, or social media preview cards, follow these best practices:

## 1. Page Metadata & Headings
- Include unique, descriptive `<title>` tags and `<meta name="description">` strings for every page route.
- Maintain strict single `<h1>` heading hierarchy per page, followed by logical `<h2>`, `<h3>` subheadings.
- Configure canonical tags (`<link rel="canonical" href="...">`) to prevent duplicate content indexing penalties.

## 2. Open Graph & Social Cards
- Implement Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) and Twitter card tags (`twitter:card`, `twitter:title`, `twitter:image`) for dynamic social sharing previews.
- Ensure social preview images use absolute URLs and optimized image dimensions (e.g., 1200x630px).

## 3. Structured Data & Indexing
- Embed Schema.org JSON-LD scripts (`application/ld+json`) for rich snippets (Product, Article, Organization, BreadcrumbList).
- Generate dynamic `sitemap.xml` and `robots.txt` files to guide search crawler indexation.
