import { describe, it, expect, vi } from 'vitest';
import { setNodeEnv } from "@/tests/helpers/setNodeEnv";

vi.mock('next/server', () => {
  class StubHeaders {
    private map = new Map<string, string>();
    set(k: string, v: string) { this.map.set(k.toLowerCase(), v); }
    get(k: string) { return this.map.get(k.toLowerCase()) || null; }
    has(k: string) { return this.map.has(k.toLowerCase()); }
  }

  const mockNextResponse = {
    next: vi.fn(() => ({ status: 200, headers: new StubHeaders() })),
    redirect: vi.fn((url: string | URL, status = 307) => {
      const h = new StubHeaders();
      h.set('location', url.toString());
      return { status, headers: h };
    }),
    json: vi.fn((data: unknown, options?: { status?: number }) => ({ status: options?.status || 200, headers: new StubHeaders() }))
  };

  return {
    NextRequest: class NextRequest {
      nextUrl: { pathname: string; search: string; clone: () => URL };
      method: string;
      headers: StubHeaders;
      cookies: { has: (n: string) => boolean; getAll: () => { name: string; value: string }[]; set: (n: string, v: string) => void };
      
      constructor(url: string, init?: { method?: string; headers?: Map<string, string> | Record<string, string> }) {
        const parsed = new URL(url);
        this.nextUrl = {
          pathname: parsed.pathname,
          search: parsed.search,
          clone: () => new URL(url)
        };
        this.method = init?.method || 'GET';
        this.headers = new StubHeaders();
        if (init?.headers) {
          if (init.headers instanceof Map) {
            init.headers.forEach((v: string, k: string) => this.headers.set(k, v));
          } else {
            Object.entries(init.headers as Record<string, string>).forEach(([k, v]) => this.headers.set(k, v));
          }
        }
        const cookiesMap = new Map<string, string>();
        this.cookies = {
          has: (name: string) => cookiesMap.has(name),
          getAll: () => Array.from(cookiesMap.entries()).map(([n, v]) => ({ name: n, value: v })),
          set: (name: string, value: string) => cookiesMap.set(name, value)
        };
      }
    },
    NextResponse: mockNextResponse
  };
});

vi.mock('next-intl/middleware', () => {
  return {
    default: () => () => undefined
  };
});

import {
  isPlannerGuestAllowedPath,
  isGuestProductSurfacePath,
  isRetiredPortalSvgCatalogPath,
  isRetiredAdminStudioPath,
  resolveLegacyMemberShellRedirect,
  isPublicPortalGuestPath,
  isProtectedPath,
  hasSessionAuthCookies,
  proxy,
  buildContentSecurityPolicy,
  isCanvasHeavyPath,
  isMemberOnlyWriteApi,
  isMaintenanceMutationAllowed,
  isGuestProductContext,
} from '../../site/proxy';
import { NextRequest } from 'next/server';
import { PLANNER_GUEST_COOKIE } from '../../site/lib/auth/constants';

vi.mock('../../site/lib/platform/maintenanceMode', () => ({
  isMaintenanceReadonly: vi.fn(() => false),
}));

vi.mock('../../site/lib/auth/devAuthBypass', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../site/lib/auth/devAuthBypass')>();
  return {
    ...actual,
    isDevAuthBypassEnabled: vi.fn(actual.isDevAuthBypassEnabled),
  };
});

import { isMaintenanceReadonly } from '../../site/lib/platform/maintenanceMode';
import { isDevAuthBypassEnabled } from '../../site/lib/auth/devAuthBypass';

describe('proxy.ts', () => {
  describe('guest product surfaces', () => {
    it('treats full /ooplanner tree as planner guest-allowed (not protected)', () => {
      expect(isPlannerGuestAllowedPath('/ooplanner')).toBe(true);
      expect(isPlannerGuestAllowedPath('/ooplanner/projects')).toBe(true);
      expect(isPlannerGuestAllowedPath('/ooplanner/projects/abc')).toBe(true);
      expect(isProtectedPath('/ooplanner/projects')).toBe(false);
      expect(isPlannerGuestAllowedPath('/oostudio')).toBe(false);
      expect(isPlannerGuestAllowedPath('/other')).toBe(false);
    });

    it('classifies both product shells as guest surfaces', () => {
      expect(isGuestProductSurfacePath('/ooplanner')).toBe(true);
      expect(isGuestProductSurfacePath('/oostudio/workspace')).toBe(true);
      expect(isGuestProductSurfacePath('/admin')).toBe(false);
    });
  });

  describe('isProtectedPath', () => {
    it('should return true for /dashboard', () => {
      expect(isProtectedPath('/dashboard')).toBe(true);
    });

    it('should return true for /portal/123', () => {
      expect(isProtectedPath('/portal/123')).toBe(true);
    });

    it('classifies retired /portal/svg-catalog as retired (Phase 7 Stage B)', () => {
      expect(isRetiredPortalSvgCatalogPath('/portal/svg-catalog')).toBe(true);
      expect(isRetiredPortalSvgCatalogPath('/portal/svg-catalog/side-table-001')).toBe(true);
    });

    it('classifies retired admin studio paths (not login walls)', () => {
      expect(isRetiredAdminStudioPath('/admin/svg-editor')).toBe(true);
      expect(isRetiredAdminStudioPath('/admin/product-studio/x')).toBe(true);
      expect(isProtectedPath('/admin/svg-editor')).toBe(false);
      expect(resolveLegacyMemberShellRedirect('/crm')).toBe('/admin/crm/');
      expect(resolveLegacyMemberShellRedirect('/ops/x')).toBe('/admin/');
    });

    it('should return false for public guest portal entry', () => {
      expect(isPublicPortalGuestPath('/portal/guest')).toBe(true);
      expect(isPublicPortalGuestPath('/portal/guest/view/abc')).toBe(true);
      expect(isProtectedPath('/portal/guest')).toBe(false);
      expect(isProtectedPath('/portal/guest/')).toBe(false);
      expect(isProtectedPath('/portal/guest/view/abc')).toBe(false);
    });

    it('should still protect member portal routes', () => {
      expect(isProtectedPath('/portal')).toBe(true);
      expect(isProtectedPath('/portal/123')).toBe(true);
    });

    it('should return true for /admin', () => {
      expect(isProtectedPath('/admin')).toBe(true);
    });

    it('protects nested /admin/* page paths (except retired studio short-circuits)', () => {
      expect(isProtectedPath('/admin/')).toBe(true);
      expect(isProtectedPath('/admin/crm')).toBe(true);
      expect(isProtectedPath('/admin/crm/projects')).toBe(true);
      expect(isProtectedPath('/admin/catalog')).toBe(true);
      // Retired Product Studio URLs are not login walls — 308 to /oostudio.
      expect(isProtectedPath('/admin/svg-editor')).toBe(false);
    });

    it('does not edge-protect /api/admin (JSON auth via requireAdminSession/withAuth)', () => {
      // Edge redirect would break API clients that expect 401/403 JSON, not /access HTML.
      expect(isProtectedPath('/api/admin')).toBe(false);
      expect(isProtectedPath('/api/admin/plans')).toBe(false);
      expect(isProtectedPath('/api/admin/product-studio')).toBe(false);
    });

    it('does not treat dead top-level /crm or /ops as protected (308 short-circuit instead)', () => {
      expect(isProtectedPath('/crm')).toBe(false);
      expect(isProtectedPath('/ops')).toBe(false);
    });

    it('should return false for /public', () => {
      expect(isProtectedPath('/public')).toBe(false);
    });
  });

  describe('buildContentSecurityPolicy', () => {
    it('omits unsafe-eval on marketing paths', () => {
      expect(buildContentSecurityPolicy('/contact')).not.toContain("'unsafe-eval'");
    });

    it('allows unsafe-eval on marketing paths in development (React Refresh)', () => {
      const prev = process.env.NODE_ENV;
      setNodeEnv('development');
      try {
        expect(buildContentSecurityPolicy('/contact')).toContain("'unsafe-eval'");
      } finally {
        setNodeEnv(prev);
      }
    });

    it('allows unsafe-eval only on canvas-heavy product shells', () => {
      expect(isCanvasHeavyPath('/ooplanner/projects')).toBe(true);
      expect(isCanvasHeavyPath('/oostudio')).toBe(true);
      expect(isCanvasHeavyPath('/admin')).toBe(false);
      expect(isCanvasHeavyPath('/dashboard')).toBe(false);
      expect(isCanvasHeavyPath('/catalog')).toBe(false);
      expect(isCanvasHeavyPath('/contact')).toBe(false);
      expect(buildContentSecurityPolicy('/ooplanner/projects')).toContain("'unsafe-eval'");
      expect(buildContentSecurityPolicy('/admin')).not.toContain("'unsafe-eval'");
    });

    it('allows Vercel Analytics and Speed Insights (dev scripts on va.vercel-scripts.com)', () => {
      const csp = buildContentSecurityPolicy('/contact');
      expect(csp).toContain('https://va.vercel-scripts.com');
      expect(csp).toContain('https://vitals.vercel-insights.com');
      expect(csp).toContain('https://static.cloudflareinsights.com');
    });

    it('allows Google Analytics 4 endpoints for the Zaraz GA4 tag', () => {
      const csp = buildContentSecurityPolicy('/contact');
      expect(csp).toContain('https://www.google-analytics.com');
      expect(csp).toContain('https://region1.google-analytics.com');
      expect(csp).toContain('https://stats.g.doubleclick.net');
    });

    it('omits unused CDNs and bare http images from CSP', () => {
      const csp = buildContentSecurityPolicy('/contact');
      expect(csp).not.toContain('esm.sh');
      expect(csp).not.toContain('unpkg.com');
      expect(csp).not.toContain('cdn.tldraw.com');
      expect(csp).not.toContain('googletagmanager.com');
      expect(csp).toContain("img-src 'self' data: blob: https:");
      expect(csp).not.toMatch(/img-src[^;]*http:/);
    });
  });

  describe('proxy', () => {
    it('should return a response with security headers for public paths', async () => {
      const request = new NextRequest('http://localhost/public', {
        headers: { 'user-agent': 'test' }
      });
      const response = await proxy(request as unknown as NextRequest);
      expect(response).toBeDefined();
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
      expect(response.headers.get('Cross-Origin-Opener-Policy')).toBe(
        'same-origin-allow-popups',
      );
      expect(response.headers.get('Cross-Origin-Resource-Policy')).toBe('same-site');
      expect(response.headers.get('Content-Security-Policy')).not.toContain("'unsafe-eval'");
    });

    it('should redirect unauthenticated users from protected paths', async () => {
      const request = new NextRequest('http://localhost/dashboard');
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/access');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
      expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    });

    it('redirects unauthenticated /admin to /access when DEV_AUTH_BYPASS is off', async () => {
      const prevBypass = process.env.DEV_AUTH_BYPASS;
      const prevNode = process.env.NODE_ENV;
      process.env.DEV_AUTH_BYPASS = '0';
      setNodeEnv('test');
      try {
        const request = new NextRequest('http://localhost/admin');
        const response = await proxy(request as unknown as NextRequest);
        expect(response.status).toBe(307);
        const location = response.headers.get('location') ?? '';
        expect(location).toContain('/access');
        expect(location).toContain('next=');
        expect(decodeURIComponent(location)).toContain('/admin');
      } finally {
        process.env.DEV_AUTH_BYPASS = prevBypass;
        setNodeEnv(prevNode);
      }
    });

    it.each(['/admin/crm', '/admin/catalog', '/admin/plans'] as const)(
      'redirects unauthenticated %s to /access when DEV_AUTH_BYPASS is off',
      async (path) => {
        const prevBypass = process.env.DEV_AUTH_BYPASS;
        const prevNode = process.env.NODE_ENV;
        process.env.DEV_AUTH_BYPASS = '0';
        setNodeEnv('test');
        try {
          const request = new NextRequest(`http://localhost${path}`);
          const response = await proxy(request as unknown as NextRequest);
          expect(response.status).toBe(307);
          const location = response.headers.get('location') ?? '';
          expect(location).toContain('/access');
          expect(decodeURIComponent(location)).toContain(path);
        } finally {
          process.env.DEV_AUTH_BYPASS = prevBypass;
          setNodeEnv(prevNode);
        }
      },
    );

    it('still redirects unauthenticated /admin in production even if DEV_AUTH_BYPASS=1', async () => {
      const prevBypass = process.env.DEV_AUTH_BYPASS;
      const prevNode = process.env.NODE_ENV;
      process.env.DEV_AUTH_BYPASS = '1';
      setNodeEnv('production');
      try {
        const request = new NextRequest('http://localhost/admin/catalog');
        const response = await proxy(request as unknown as NextRequest);
        expect(response.status).toBe(307);
        const location = response.headers.get('location') ?? '';
        expect(location).toContain('/access');
      } finally {
        process.env.DEV_AUTH_BYPASS = prevBypass;
        setNodeEnv(prevNode);
      }
    });

    it('allows /admin without cookies when DEV_AUTH_BYPASS=1 (local only)', async () => {
      const prevBypass = process.env.DEV_AUTH_BYPASS;
      const prevNode = process.env.NODE_ENV;
      process.env.DEV_AUTH_BYPASS = '1';
      setNodeEnv('development');
      try {
        const request = new NextRequest('http://localhost/admin/catalog');
        const response = await proxy(request as unknown as NextRequest);
        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
      } finally {
        process.env.DEV_AUTH_BYPASS = prevBypass;
        setNodeEnv(prevNode);
      }
    });

    it('short-circuits retired /admin/svg-editor to /oostudio/ without auth (308)', async () => {
      const request = new NextRequest('http://localhost/admin/svg-editor');
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(308);
      expect(response.headers.get('location')).toMatch(/\/oostudio\/?$/);
    });

    it('short-circuits retired /admin/product-studio to /oostudio/ without auth (308)', async () => {
      const request = new NextRequest('http://localhost/admin/product-studio/abc');
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(308);
      expect(response.headers.get('location')).toMatch(/\/oostudio\/?$/);
    });

    it('short-circuits dead /crm to /admin/crm/ (308)', async () => {
      const request = new NextRequest('http://localhost/crm/projects');
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(308);
      expect(response.headers.get('location')).toMatch(/\/admin\/crm\/?$/);
    });

    it('should redirect retired /portal/svg-catalog to /products/ (308)', async () => {
      const request = new NextRequest('http://localhost/portal/svg-catalog');
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(308);
      expect(response.headers.get('location')).toMatch(/\/products\/?$/);
    });

    it('should redirect retired /portal/svg-catalog/[slug] to /products/', async () => {
      const request = new NextRequest('http://localhost/portal/svg-catalog/side-table-001');
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(308);
      expect(response.headers.get('location')).toMatch(/\/products\/?$/);
    });

    it('should allow unauthenticated users on public /portal/guest', async () => {
      const request = new NextRequest('http://localhost/portal/guest');
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('should allow protected paths when Supabase auth cookies are present', async () => {
      const request = new NextRequest('http://localhost/admin/');
      request.cookies.set('sb-erpweaiypimorcunaimz-auth-token', 'session');
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('detects Supabase session cookies only (Appwrite a_session_* dropped)', () => {
      expect(
        hasSessionAuthCookies([{ name: 'sb-project-auth-token', value: 'x' }]),
      ).toBe(true);
      expect(
        hasSessionAuthCookies([{ name: 'a_session_legacy', value: 'x' }]),
      ).toBe(false);
      expect(
        hasSessionAuthCookies([{ name: 'planner_guest', value: 'x' }]),
      ).toBe(false);
    });

    it('should allow unauthenticated users with planner guest cookie to access guest paths', async () => {
      const request = new NextRequest('http://localhost/ooplanner/projects');
      request.cookies.set(PLANNER_GUEST_COOKIE, 'true');
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
    
    it('should block guest users from performing mutations', async () => {
      const request = new NextRequest('http://localhost/ooplanner/projects', {
        method: 'POST',
        headers: { 'next-action': 'some-action' }
      });
      request.cookies.set(PLANNER_GUEST_COOKIE, 'true');
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(403);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('blocks unauthenticated POST /api/plans (member-only write)', async () => {
      const request = new NextRequest('http://localhost/api/plans', {
        method: 'POST',
      });
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(403);
    });

    it('allows unauthenticated POST /api/Planner/projects at edge (handler CSRF/auth)', async () => {
      const request = new NextRequest('http://localhost/api/Planner/projects', {
        method: 'POST',
      });
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(200);
    });

    it('allows unauthenticated GET /oostudio (public product surface)', async () => {
      const request = new NextRequest('http://localhost/oostudio/');
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('returns 503 for Planner write during maintenance', async () => {
      vi.mocked(isMaintenanceReadonly).mockReturnValueOnce(true);
      const request = new NextRequest('http://localhost/api/Planner/projects', {
        method: 'POST',
      });
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(503);
      expect(response.headers.get('x-site-maintenance')).toBe('readonly');
    });

    it('returns 503 for previously unlisted API writes during maintenance (fail-closed)', async () => {
      vi.mocked(isMaintenanceReadonly).mockReturnValueOnce(true);
      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
      });
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(503);
      expect(response.headers.get('x-site-maintenance')).toBe('readonly');
    });

    it('allows log-error POST during maintenance (observability allowlist)', async () => {
      vi.mocked(isMaintenanceReadonly).mockReturnValueOnce(true);
      const request = new NextRequest('http://localhost/api/log-error', {
        method: 'POST',
      });
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-site-maintenance')).toBe('readonly');
    });

    it('policy A: keeps /dashboard browseable during maintenance', async () => {
      vi.mocked(isMaintenanceReadonly).mockReturnValueOnce(true);
      const request = new NextRequest('http://localhost/dashboard');
      request.cookies.set('sb-project-auth-token', 'session');
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
      expect(response.headers.get('x-site-maintenance')).toBe('readonly');
    });

    it('redirects /admin to /offline during maintenance', async () => {
      vi.mocked(isMaintenanceReadonly).mockReturnValueOnce(true);
      const request = new NextRequest('http://localhost/admin/');
      const response = await proxy(request as unknown as NextRequest);
      expect([307, 308]).toContain(response.status);
      expect(response.headers.get('location')).toMatch(/\/offline/);
    });

    it('allows /admin during maintenance when dev auth bypass is enabled', async () => {
      vi.mocked(isMaintenanceReadonly).mockReturnValueOnce(true);
      vi.mocked(isDevAuthBypassEnabled).mockReturnValueOnce(true);
      const request = new NextRequest('http://localhost/admin/');
      const response = await proxy(request as unknown as NextRequest);
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });
  });

  describe('member-only / guest helpers', () => {
    it('classifies member write APIs by prefix and path segments (not substrings)', () => {
      expect(isMemberOnlyWriteApi('/api/plans')).toBe(true);
      expect(isMemberOnlyWriteApi('/api/plans/abc')).toBe(true);
      expect(isMemberOnlyWriteApi('/api/admin/features')).toBe(true);
      expect(isMemberOnlyWriteApi('/api/exports')).toBe(true);
      expect(isMemberOnlyWriteApi('/api/Studio/furniture/abc/publish')).toBe(true);
      expect(isMemberOnlyWriteApi('/api/files/exports/e_foo.json')).toBe(true);
      // Guest fork surfaces stay open at the edge
      expect(isMemberOnlyWriteApi('/api/Planner/projects')).toBe(false);
      expect(isMemberOnlyWriteApi('/api/Studio/furniture')).toBe(false);
      // Substring trap: must not treat "export" embedded in a longer segment
      expect(isMemberOnlyWriteApi('/api/Studio/furniture/exportable-desk')).toBe(
        false,
      );
    });

    it('maintenance mutation allowlist is fail-closed', () => {
      expect(isMaintenanceMutationAllowed('/api/log-error')).toBe(true);
      expect(isMaintenanceMutationAllowed('/api/log-error/extra')).toBe(true);
      expect(isMaintenanceMutationAllowed('/api/Planner/projects')).toBe(false);
      expect(isMaintenanceMutationAllowed('/api/products')).toBe(false);
      expect(isMaintenanceMutationAllowed('/api/health')).toBe(false);
    });

    it('detects guest product context from path and referer', () => {
      expect(isGuestProductContext('/ooplanner', false, null)).toBe(true);
      expect(isGuestProductContext('/oostudio', false, null)).toBe(true);
      expect(isGuestProductContext('/about', true, null)).toBe(true);
      expect(
        isGuestProductContext('/api/plans', false, 'http://localhost/ooplanner/'),
      ).toBe(true);
      expect(isGuestProductContext('/about', false, null)).toBe(false);
    });

    it('blocks guest server actions only on product surface paths', async () => {
      const guestProduct = new NextRequest('http://localhost/ooplanner', {
        method: 'POST',
        headers: { 'next-action': 'some-action' },
      });
      guestProduct.cookies.set(PLANNER_GUEST_COOKIE, 'true');
      expect((await proxy(guestProduct as unknown as NextRequest)).status).toBe(403);

      // Guest cookie + non-product path + server action: not product-surface gated
      // (member-only write rules may still apply for /api/*).
      const marketing = new NextRequest('http://localhost/about', {
        method: 'POST',
        headers: { 'next-action': 'some-action' },
      });
      marketing.cookies.set(PLANNER_GUEST_COOKIE, 'true');
      expect((await proxy(marketing as unknown as NextRequest)).status).toBe(200);
    });
  });
});
