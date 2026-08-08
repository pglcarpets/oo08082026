export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

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
    
    const upstreamRequest = new Request(targetUrl.toString(), request);
    upstreamRequest.headers.set('host', new URL(origin).host);
    upstreamRequest.headers.set('x-forwarded-host', url.host);
    upstreamRequest.headers.set('x-forwarded-proto', url.protocol.replace(':', ''));

    const upstreamResponse = await fetch(upstreamRequest, {
      redirect: 'manual',
      cf: {
        cacheEverything: false
      }
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set('x-oando-proxy', 'cloudflare-worker');
    
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders
    });
  }
};
