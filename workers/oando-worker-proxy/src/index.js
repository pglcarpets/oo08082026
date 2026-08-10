/** RFC 9116 security.txt - served at edge so scanners pass before Next deploy. */
const SECURITY_TXT = `# One&Only (oando.co.in) - security disclosure contact (RFC 9116)
# Prefer responsible disclosure for security issues only (not sales or support).

Contact: mailto:sales@oando.co.in
Contact: tel:+91-98356-30940
Expires: 2027-08-09T00:00:00.000Z
Preferred-Languages: en, hi
Canonical: https://oando.co.in/.well-known/security.txt
Policy: https://oando.co.in/privacy/
Hiring: https://oando.co.in/career/
`;

/** Edge TTL for Next image optimizer responses (30 days). */
const IMAGE_OPTIMIZER_TTL = 60 * 60 * 24 * 30;
/** Edge TTL for hashed Next static assets (1 year). */
const STATIC_ASSET_TTL = 60 * 60 * 24 * 365;

function securityTxtResponse() {
  return new Response(SECURITY_TXT, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=86400',
      'x-content-type-options': 'nosniff',
      'x-oando-proxy': 'security-txt',
    },
  });
}

function isImageOptimizerPath(pathname) {
  return pathname === '/_next/image' || pathname.startsWith('/_next/image/');
}

function isNextStaticPath(pathname) {
  return pathname.startsWith('/_next/static/');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // RFC 9116 - canonical + root alias (before R2 / Vercel).
    // Normalize trailing slash so scanners that append / still pass.
    const securityPath = pathname.replace(/\/+$/, '') || '/';
    if (
      securityPath === '/.well-known/security.txt' ||
      securityPath === '/security.txt'
    ) {
      return securityTxtResponse();
    }

    // Try R2 first for asset paths (locked layout: /assets/{marketing|catalog}/…)
    if (pathname.startsWith('/assets/') || pathname.startsWith('/images/')) {
      try {
        const r2Keys = [];
        const baseKey = pathname.slice(1);
        r2Keys.push(baseKey);
        if (baseKey.startsWith('assets/catalog/')) {
          r2Keys.push(baseKey.slice('assets/'.length));
        }
        if (baseKey.includes('/gallery/')) {
          const withoutGallery = baseKey.replace(/\/gallery\//, '/');
          r2Keys.push(withoutGallery);
          if (withoutGallery.startsWith('assets/catalog/')) {
            r2Keys.push(withoutGallery.slice('assets/'.length));
          }
        }

        let object = null;
        for (const key of r2Keys) {
          object = await env.ASSET_BUCKET.get(key);
          if (object) break;
        }

        if (!object && pathname.startsWith('/images/')) {
          const remapped =
            'assets/' +
            pathname
              .slice('/images/'.length)
              .replace(/^products\//, 'catalog/products/')
              .replace(/^(hero|client-logos|projects|fallback|home|brand)\//, 'marketing/$1/')
              .replace(/^catalog\//, 'catalog/');
          object = await env.ASSET_BUCKET.get(remapped);
        }
        
        if (object) {
          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set('etag', object.httpEtag);
          headers.set('cache-control', 'public, max-age=31536000, immutable');
          headers.set('x-oando-proxy', 'r2');
          
          return new Response(object.body, {
            headers,
          });
        }
      } catch (e) {
        // R2 fetch failed, fall through to Vercel
        console.error('R2 error:', e);
      }
    }

    // Fall back to Vercel
    const origin = env.VERCEL_ORIGIN || 'https://oostudiooplanner.vercel.app';
    const targetUrl = new URL(pathname + url.search, origin);

    const cacheImage = isImageOptimizerPath(pathname) && request.method === 'GET';
    const cacheStatic = isNextStaticPath(pathname) && request.method === 'GET';
    const edgeCacheable = cacheImage || cacheStatic;

    // Cache API key = full request URL on the public host (includes w/q for /_next/image).
    const cache = caches.default;
    if (edgeCacheable) {
      const cached = await cache.match(request);
      if (cached) {
        const hitHeaders = new Headers(cached.headers);
        hitHeaders.set('x-oando-proxy', cacheImage ? 'cf-image-cache-hit' : 'cf-static-cache-hit');
        hitHeaders.set('x-oando-cache', 'HIT');
        return new Response(cached.body, {
          status: cached.status,
          statusText: cached.statusText,
          headers: hitHeaders,
        });
      }
    }
    
    const upstreamRequest = new Request(targetUrl.toString(), request);
    // Vercel routes by Host = deployment hostname; custom domain is preserved
    // in x-forwarded-host for app logic.
    upstreamRequest.headers.set('host', new URL(origin).host);
    upstreamRequest.headers.set('x-forwarded-host', url.host);
    upstreamRequest.headers.set('x-forwarded-proto', url.protocol.replace(':', ''));

    const upstreamResponse = await fetch(upstreamRequest, {
      redirect: 'manual',
      cf: edgeCacheable
        ? {
            // Override origin max-age=0 so CF will store optimizer responses.
            cacheEverything: true,
            cacheTtl: cacheImage ? IMAGE_OPTIMIZER_TTL : STATIC_ASSET_TTL,
          }
        : {
            cacheEverything: false,
          },
    });

    // Rebuild headers so we can fully control indexing directives.
    // CRITICAL: vercel.json sets X-Robots-Tag: noindex when Host is *.vercel.app.
    // We must set Host to the Vercel origin for routing, so that header would
    // poison apex traffic unless we remove/override it for public hosts.
    const responseHeaders = new Headers();
    upstreamResponse.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      // Drop every robots tag from origin; re-apply only for non-public hosts.
      if (lower === 'x-robots-tag') return;
      // Avoid hop-by-hop / encoding issues when streaming body as-is.
      if (lower === 'content-encoding' || lower === 'content-length' || lower === 'transfer-encoding') {
        return;
      }
      responseHeaders.append(key, value);
    });
    responseHeaders.set('x-oando-proxy', 'cloudflare-worker');
    responseHeaders.set('x-oando-cache', edgeCacheable ? 'MISS' : 'BYPASS');

    // Long-lived browser + edge cache for optimizer + hashed static.
    if (cacheImage && upstreamResponse.ok) {
      responseHeaders.set(
        'cache-control',
        `public, max-age=${IMAGE_OPTIMIZER_TTL}, stale-while-revalidate=86400`
      );
      responseHeaders.set('x-oando-proxy', 'cf-image-cache-miss');
    } else if (cacheStatic && upstreamResponse.ok) {
      responseHeaders.set(
        'cache-control',
        `public, max-age=${STATIC_ASSET_TTL}, immutable`
      );
      responseHeaders.set('x-oando-proxy', 'cf-static-cache-miss');
    }

    const publicHost = url.hostname.toLowerCase().replace(/^www\./, '');
    const extraHosts = (env.PUBLIC_INDEXABLE_HOSTS || '')
      .split(',')
      .map((h) => h.trim().toLowerCase().replace(/^www\./, ''))
      .filter(Boolean);
    const isPublicApex =
      publicHost === 'oando.co.in' ||
      extraHosts.includes(publicHost) ||
      extraHosts.includes(url.hostname.toLowerCase());

    if (isPublicApex) {
      // Explicit allow — do not leave noindex from Vercel preview config.
      responseHeaders.set('X-Robots-Tag', 'all');
      responseHeaders.set('x-oando-indexable', '1');
    } else if (publicHost.endsWith('.vercel.app') || publicHost.endsWith('.workers.dev')) {
      responseHeaders.set('X-Robots-Tag', 'noindex, nofollow');
    }

    const response = new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });

    // Populate Cache API so the next India request hits the edge, not Vercel.
    if (edgeCacheable && upstreamResponse.ok && request.method === 'GET') {
      const toCache = response.clone();
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(cache.put(request, toCache));
      } else {
        await cache.put(request, toCache);
      }
    }

    return response;
  }
};
