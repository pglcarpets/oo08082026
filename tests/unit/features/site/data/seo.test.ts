import { describe, it, expect } from 'vitest';
import type { Metadata } from 'next';
import {
  buildSiteMetadata,
  buildPageMetadata,
  buildPageJsonLd,
  buildBreadcrumbJsonLd,
  buildGlobalJsonLd,
  buildLocaleAlternates,
  buildProductJsonLd,
  buildCareerJobsJsonLd,
  buildCanonicalUrl,
  sanitizeCanonicalPath,
  resolveDocumentTitle,
  countBrandPipeSegments,
  normalizeSiteOrigin,
  LOCALE_HREFLANG,
} from '@/features/site/data/seo';
import { SITE_BRAND } from '@/features/site/data/brand';
import { SITE_CONTACT } from '@/features/site/data/contact';

type OpenGraphFields = {
  type?: string;
  locale?: string;
  url?: string | URL;
  images?: Array<string | { url?: string | URL; width?: number; height?: number }>;
};

type TwitterFields = {
  card?: string;
};

function openGraphFields(meta: Metadata): OpenGraphFields {
  return (meta.openGraph ?? {}) as OpenGraphFields;
}

function twitterFields(meta: Metadata): TwitterFields {
  return (meta.twitter ?? {}) as TwitterFields;
}

const TEST_SITE_URL = 'https://example.com';

// ---------------------------------------------------------------------------
// buildSiteMetadata
// ---------------------------------------------------------------------------

describe('buildSiteMetadata', () => {
  it('returns metadataBase as a URL object', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.metadataBase).toBeInstanceOf(URL);
    expect(meta.metadataBase!.toString()).toBe(TEST_SITE_URL + '/');
  });

  it('has a title object with default and template', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.title).toBeDefined();
    expect(typeof meta.title).toBe('object');
  });

  it('has a non-empty description', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.description!.length).toBeGreaterThan(10);
  });

  it('has keywords array', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(Array.isArray(meta.keywords)).toBe(true);
    expect(meta.keywords!.length).toBeGreaterThan(0);
  });

  it('has openGraph configuration', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    const og = openGraphFields(meta);
    expect(meta.openGraph).toBeDefined();
    expect(og.type).toBe('website');
    expect(og.locale).toBe('en_IN');
  });

  it('has openGraph images with dimensions', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    const images = openGraphFields(meta).images;
    expect(images).toBeDefined();
    expect(Array.isArray(images)).toBe(true);
    expect(images!.length).toBeGreaterThan(0);
    const first = images![0];
    expect(typeof first === 'object' && first ? first.width : undefined).toBe(1200);
    expect(typeof first === 'object' && first ? first.height : undefined).toBe(630);
  });

  it('has twitter card configuration', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.twitter).toBeDefined();
    expect(twitterFields(meta).card).toBe('summary_large_image');
  });

  it('has robots allowing index and follow', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.robots).toEqual({ index: true, follow: true });
  });
});

// ---------------------------------------------------------------------------
// buildLocaleAlternates
// ---------------------------------------------------------------------------

describe('buildLocaleAlternates', () => {
  it('uses the same canonical URL for every locale when localePrefix is never', () => {
    const langs = buildLocaleAlternates(TEST_SITE_URL, '/planner');
    const canonical = 'https://example.com/planner/';
    for (const tag of Object.values(LOCALE_HREFLANG)) {
      expect(langs[tag]).toBe(canonical);
    }
    expect(langs['x-default']).toBe(canonical);
  });

  it('does not emit locale-prefixed paths for nested routes', () => {
    const langs = buildLocaleAlternates(TEST_SITE_URL, '/planner/features/measure');
    const canonical = 'https://example.com/planner/features/measure/';
    expect(langs['de-DE']).toBe(canonical);
    expect(langs['fr-FR']).toBe(canonical);
    expect(langs['de-DE']).not.toContain('/de/');
  });
});

// ---------------------------------------------------------------------------
// buildPageMetadata
// ---------------------------------------------------------------------------

describe('resolveDocumentTitle', () => {
  it('appends brand once for plain titles', () => {
    expect(resolveDocumentTitle('Workstations')).toBe(
      `Workstations | ${SITE_BRAND.titleSuffix}`,
    );
    expect(countBrandPipeSegments(resolveDocumentTitle('Workstations'))).toBe(1);
  });

  it('collapses repeated brand suffixes (SF-02)', () => {
    const doubled = `Workstations | ${SITE_BRAND.titleSuffix} | ${SITE_BRAND.titleSuffix}`;
    const resolved = resolveDocumentTitle(doubled);
    expect(resolved).toBe(`Workstations | ${SITE_BRAND.titleSuffix}`);
    expect(countBrandPipeSegments(resolved)).toBe(1);
  });

  it('collapses three trailing brand segments and en-dash separators', () => {
    const messy = `Seating | ${SITE_BRAND.titleSuffix} – ${SITE_BRAND.titleSuffix} — ${SITE_BRAND.titleSuffix}`;
    expect(resolveDocumentTitle(messy)).toBe(`Seating | ${SITE_BRAND.titleSuffix}`);
  });

  it('keeps default title intact and strips an extra trailing brand', () => {
    expect(resolveDocumentTitle(SITE_BRAND.defaultTitle)).toBe(SITE_BRAND.defaultTitle);
    expect(
      resolveDocumentTitle(`${SITE_BRAND.defaultTitle} | ${SITE_BRAND.titleSuffix}`),
    ).toBe(SITE_BRAND.defaultTitle);
  });

  it('does not double-append when brand is already embedded mid-title', () => {
    const about = 'About One&Only | Office furniture Patna';
    expect(resolveDocumentTitle(about)).toBe(about);
    expect(countBrandPipeSegments(about)).toBe(0);
  });

  it('empty input falls back to default title', () => {
    expect(resolveDocumentTitle('   ')).toBe(SITE_BRAND.defaultTitle);
  });
});

describe('normalizeSiteOrigin / host honesty', () => {
  it('strips trailing slashes without inventing a host', () => {
    expect(normalizeSiteOrigin('https://seo-host.example.com///')).toBe(
      'https://seo-host.example.com',
    );
    expect(normalizeSiteOrigin('https://oando.co.in')).toBe('https://oando.co.in');
  });

  it('buildPageMetadata canonical uses the given origin, never localhost', () => {
    const meta = buildPageMetadata('https://seo-host.example.com///', {
      title: 'Workstations',
      description: 'Category of modular workstations for offices.',
      path: '/products/workstations',
    });
    expect(String(meta.alternates!.canonical)).toBe(
      'https://seo-host.example.com/products/workstations/',
    );
    expect(String(meta.alternates!.canonical)).not.toMatch(/localhost|127\.0\.0\.1/i);
    expect(meta.metadataBase!.toString()).toBe('https://seo-host.example.com/');
  });
});

describe('sanitizeCanonicalPath / buildCanonicalUrl open-redirect guards', () => {
  it('keeps ordinary marketing paths on the configured origin', () => {
    expect(sanitizeCanonicalPath('/about')).toBe('/about/');
    expect(sanitizeCanonicalPath('products/seating')).toBe('/products/seating/');
    expect(buildCanonicalUrl(TEST_SITE_URL, '/about')).toBe('https://example.com/about/');
    expect(buildCanonicalUrl(TEST_SITE_URL, '/products/seating/mesh-chair')).toBe(
      'https://example.com/products/seating/mesh-chair/',
    );
  });

  it('rejects absolute external URLs and schemes so canonicals never leave the site host', () => {
    for (const attack of [
      'https://evil.com',
      'http://evil.com/phish',
      '//evil.com/phish',
      'javascript:alert(1)',
      'foo://bar',
      '/\\evil.com',
      '/%2f%2fevil.com',
      '/products/seating/https://evil.com',
    ]) {
      expect(sanitizeCanonicalPath(attack), attack).toBe('/');
      const canonical = buildCanonicalUrl(TEST_SITE_URL, attack);
      expect(canonical, attack).toBe('https://example.com/');
      expect(canonical, attack).not.toMatch(/evil\.com|javascript:/i);
    }
  });

  it('buildPageMetadata never emits foreign-host canonicals from poisoned path input', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, {
      title: 'Poison',
      description: 'A long enough description for SEO security tests.',
      path: 'https://evil.example/steal',
    });
    expect(String(meta.alternates!.canonical)).toBe('https://example.com/');
    expect(String(meta.openGraph!.url)).toBe('https://example.com/');
    expect(String(meta.alternates!.canonical)).not.toMatch(/evil/i);
  });

  it('buildProductJsonLd rewrites foreign absolute product URLs onto the site origin', () => {
    const ld = buildProductJsonLd(TEST_SITE_URL, {
      name: 'Desk Pro',
      description: 'Modular desk for open offices and collaborative spaces.',
      url: 'https://evil.example/products/workstations/desk-pro',
      image: '/assets/catalog/desk.webp',
    });
    expect(ld.url).toBe('https://example.com/products/workstations/desk-pro');
    expect(ld['@id']).toBe('https://example.com/products/workstations/desk-pro#product');
    expect(String(ld.url)).not.toMatch(/evil/i);
  });
});

describe('buildPageMetadata', () => {
  const input = {
    title: 'Test Page',
    description: 'A description for testing',
    path: '/about',
  };

  it('sets an absolute title with a single brand suffix', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(meta.title).toEqual({
      absolute: `Test Page | ${SITE_BRAND.titleSuffix}`,
    });
    expect(meta.openGraph!.title).toBe(`Test Page | ${SITE_BRAND.titleSuffix}`);
    expect(countBrandPipeSegments(String((meta.title as { absolute: string }).absolute))).toBe(1);
  });

  it('collapses pre-suffixed input into one absolute brand title', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, {
      ...input,
      title: `Test Page | ${SITE_BRAND.titleSuffix} | ${SITE_BRAND.titleSuffix}`,
    });
    expect(meta.title).toEqual({
      absolute: `Test Page | ${SITE_BRAND.titleSuffix}`,
    });
  });

  it('sets the description from input', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(meta.description).toBe('A description for testing');
  });

  it('builds canonical URL from siteUrl and path', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(meta.alternates!.canonical).toBe('https://example.com/about/');
  });

  it('canonical URL has no double slashes in path', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, { ...input, path: '/products/seating' });
    const canonical = meta.alternates!.canonical as string;
    // After protocol, no double slashes
    const afterProtocol = canonical.replace('https://', '');
    expect(afterProtocol).not.toContain('//');
  });

  it('openGraph url matches canonical', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(meta.openGraph!.url).toBe('https://example.com/about/');
  });

  it('openGraph images have width 1200 and height 630', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    const images = meta.openGraph!.images as Array<{ width: number; height: number }>;
    expect(images[0].width).toBe(1200);
    expect(images[0].height).toBe(630);
  });

  it('defaults type to website when not specified', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(openGraphFields(meta).type).toBe('website');
  });

  it('uses custom type when specified', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, { ...input, type: 'article' });
    expect(openGraphFields(meta).type).toBe('article');
  });

  it('includes custom keywords when provided', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, { ...input, keywords: ['test', 'page'] });
    expect(meta.keywords).toEqual(['test', 'page']);
  });
});

// ---------------------------------------------------------------------------
// buildPageJsonLd
// ---------------------------------------------------------------------------

describe('buildPageJsonLd', () => {
  const input = {
    path: '/about',
    title: 'About Us',
    description: 'Learn about our company',
    pageType: 'WebPage' as const,
  };

  it('has @context set to schema.org', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld['@context']).toBe('https://schema.org');
  });

  it('has @type matching input pageType', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld['@type']).toBe('WebPage');
  });

  it('builds url from siteUrl and path', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld.url).toBe('https://example.com/about/');
  });

  it('sets name from title', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld.name).toBe('About Us');
  });

  it('sets description from input', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld.description).toBe('Learn about our company');
  });

  it('has @id with #webpage suffix', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld['@id']).toBe('https://example.com/about/#webpage');
  });

  it('sets inLanguage to en-IN', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld.inLanguage).toBe('en-IN');
  });

  it('supports CollectionPage type', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, { ...input, pageType: 'CollectionPage' });
    expect(ld['@type']).toBe('CollectionPage');
  });
});

describe('buildCareerJobsJsonLd', () => {
  it('emits JobPosting graph for office furniture openings', () => {
    const ld = buildCareerJobsJsonLd(TEST_SITE_URL, [
      {
        title: 'Workspace Planner',
        department: 'Planning and Design',
        location: 'Patna',
      },
      {
        title: 'Project Sales Manager',
        department: 'Enterprise Sales',
        location: 'Patna / Ranchi',
      },
    ]);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@graph']).toHaveLength(2);
    expect(ld['@graph'][0]['@type']).toBe('JobPosting');
    expect(ld['@graph'][0].industry).toBe('Office Furniture');
    expect(ld['@graph'][0].jobLocation.address.addressLocality).toBe('Patna');
    expect(ld['@graph'][0].jobLocation.address.addressRegion).toBe('Bihar');
    expect(ld['@graph'][1].description).toMatch(/Ranchi|Bihar|Jharkhand/i);
  });
});

// ---------------------------------------------------------------------------
// buildBreadcrumbJsonLd
// ---------------------------------------------------------------------------

describe('buildBreadcrumbJsonLd', () => {
  it('has @type BreadcrumbList', () => {
    const ld = buildBreadcrumbJsonLd(TEST_SITE_URL, [{ name: 'Home', path: '/' }]);
    expect(ld['@type']).toBe('BreadcrumbList');
  });

  it('creates list items with position starting at 1', () => {
    const items = [
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
    ];
    const ld = buildBreadcrumbJsonLd(TEST_SITE_URL, items);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[1].position).toBe(2);
  });

  it('builds full URLs for each breadcrumb item', () => {
    const items = [{ name: 'Products', path: '/products' }];
    const ld = buildBreadcrumbJsonLd(TEST_SITE_URL, items);
    expect(ld.itemListElement[0].item).toBe('https://example.com/products/');
  });

  it('sets name for each breadcrumb item', () => {
    const items = [{ name: 'Seating', path: '/products/seating' }];
    const ld = buildBreadcrumbJsonLd(TEST_SITE_URL, items);
    expect(ld.itemListElement[0].name).toBe('Seating');
  });
});

// ---------------------------------------------------------------------------
// buildGlobalJsonLd
// ---------------------------------------------------------------------------

describe('buildGlobalJsonLd', () => {
  it('returns schema.org graph with organization, website, and local business', () => {
    const ld = buildGlobalJsonLd(TEST_SITE_URL);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@graph']).toHaveLength(3);
    const types = ld['@graph'].map((node: { '@type': string }) => node['@type']);
    expect(types).toEqual(['Organization', 'WebSite', 'FurnitureStore']);
  });

  it('organization node includes contact points and social sameAs links', () => {
    const ld = buildGlobalJsonLd(TEST_SITE_URL);
    const org = ld['@graph'].find((node: { '@type': string }) => node['@type'] === 'Organization');
    expect(org).toBeDefined();
    if (!org) {
      throw new Error('expected Organization node');
    }
    expect(org.name).toBe(SITE_BRAND.companyName);
    expect(org.logo).toBe(`${TEST_SITE_URL}/logo-v2.webp`);
    expect(org.email).toBe(SITE_CONTACT.salesEmail);
    expect(org.contactPoint).toHaveLength(2);
    expect(org.sameAs).toContain(TEST_SITE_URL);
    expect(org.sameAs?.length).toBeGreaterThan(SITE_CONTACT.socialLinks.length);
  });

  it('website node references organization publisher', () => {
    const ld = buildGlobalJsonLd(TEST_SITE_URL);
    const website = ld['@graph'].find((node: { '@type': string }) => node['@type'] === 'WebSite');
    expect(website).toBeDefined();
    if (!website) {
      throw new Error('expected WebSite node');
    }
    expect(website.inLanguage).toBe('en-IN');
    expect(website.publisher?.['@id']).toBe(`${TEST_SITE_URL}#organization`);
  });

  it('local business node includes address, geo, and hours', () => {
    const ld = buildGlobalJsonLd(TEST_SITE_URL);
    const store = ld['@graph'].find((node: { '@type': string }) => node['@type'] === 'FurnitureStore');
    expect(store).toBeDefined();
    if (!store) {
      throw new Error('expected FurnitureStore node');
    }
    expect(store.address?.addressLocality).toBe(SITE_CONTACT.address.addressLocality);
    expect(store.geo?.latitude).toBe(SITE_CONTACT.geo.latitude);
    expect(store.openingHours).toBe(SITE_CONTACT.openingHours);
    expect(store.priceRange).toBe(SITE_CONTACT.priceRange);
  });

  it('uses custom image when provided in buildPageMetadata', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, {
      title: 'Custom',
      description: 'Custom page',
      path: '/custom',
      image: '/custom-og.webp',
    });
    const images = meta.openGraph!.images as Array<{ url: string }>;
    expect(images[0].url).toBe('/custom-og.webp');
  });

  it('sets robots indexable by default and noindex when indexable false', () => {
    const on = buildPageMetadata(TEST_SITE_URL, {
      title: 'On',
      description: 'Indexable page description text.',
      path: '/on',
    });
    expect(on.robots).toEqual({ index: true, follow: true });
    const off = buildPageMetadata(TEST_SITE_URL, {
      title: 'Off',
      description: 'Utility page description text here.',
      path: '/off',
      indexable: false,
    });
    expect(off.robots).toEqual({ index: false, follow: false });
  });
});

describe('buildProductJsonLd', () => {
  it('mirrors visible fields and omits invented offers', () => {
    const ld = buildProductJsonLd(TEST_SITE_URL, {
      name: 'Chair A',
      description: 'Ergonomic task chair.',
      url: `${TEST_SITE_URL}/products/seating/chair-a`,
      image: ['/img/a.webp', '/img/b.webp'],
      sku: 'chair-a',
      category: 'Seating',
    });
    expect(ld['@type']).toBe('Product');
    expect(ld.name).toBe('Chair A');
    expect(ld.description).toBe('Ergonomic task chair.');
    expect(ld.sku).toBe('chair-a');
    expect(ld.category).toBe('Seating');
    expect(ld.image).toEqual([
      `${TEST_SITE_URL}/img/a.webp`,
      `${TEST_SITE_URL}/img/b.webp`,
    ]);
    expect(ld).not.toHaveProperty('offers');
  });
});
