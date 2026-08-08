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
    redirect: vi.fn((url: string | URL) => {
      const h = new StubHeaders();
      h.set('location', url.toString());
      return { status: 307, headers: h };
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
  isRetiredPortalSvgCatalogPath,
  isPublicPortalGuestPath,
  isProtectedPath,
  hasSessionAuthCookies,
  proxy,
  buildContentSecurityPolicy,
  isCanvasHeavyPath,
  isMemberOnlyWriteApi,
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
  describe('isPlannerGuestAllowedPath', () => {
    it('should allow /ooplanner/projects', () => {
      expect(isPlannerGuestAllowedPath('/ooplanner/projects')).toBe(true);
    });

    it('should allow /ooplanner/projects', () => {
      expect(isPlannerGuestAllowedPath('/ooplanner/projects')).toBe(true);
      expect(isProtectedPath('/ooplanner/projects')).toBe(false);
    });

    it('should allow /planner', () => {
      expect(isPlannerGuestAllowedPath('/ooplanner')).toBe(true);
    });

    it('should not allow /other', () => {
      expect(isPlannerGuestAllowedPath('/other')).toBe(false);
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
      // Auth gate never applies — proxy short-circuits 308 before isProtectedPath.
      expect(isProtectedPath('/portal/svg-catalog')).toBe(true);
      expect(isProtectedPath('/portal/svg-catalog/side-table-001')).toBe(true);
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

    it('protects nested /admin/* page paths', () => {
      expect(isProtectedPath('/admin/')).toBe(true);
      expect(isProtectedPath('/admin/svg-editor')).toBe(true);
      expect(isProtectedPath('/admin/crm')).toBe(true);
      expect(isProtectedPath('/admin/crm/projects')).toBe(true);
      expect(isProtectedPath('/admin/catalog')).toBe(true);
    });

    it('does not edge-protect /api/admin (JSON auth via requireAdminSession/withAuth)', () => {
      // Edge redirect would break API clients that expect 401/403 JSON, not /access HTML.
      expect(isProtectedPath('/api/admin')).toBe(false);
      expect(isProtectedPath('/api/admin/plans')).toBe(false);
      expect(isProtectedPath('/api/admin/product-studio')).toBe(false);
    });

    it('should return true for /crm', () => {
      expect(isProtectedPath('/crm')).toBe(true);
    });

    it('should return true for /ops', () => {
      expect(isProtectedPath('/ops')).toBe(true);
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

    it('allows unsafe-eval only on canvas-heavy paths', () => {
      expect(isCanvasHeavyPath('/ooplanner/projects')).toBe(true);
      expect(buildContentSecurityPolicy('/ooplanner/projects')).toContain("'unsafe-eval'");
    });

    it('allows Vercel Analytics and Speed Insights (dev scripts on va.vercel-scripts.com)', () => {
      const csp = buildContentSecurityPolicy('/contact');
      expect(csp).toContain('https://va.vercel-scripts.com');
      expect(csp).toContain('https://vitals.vercel-insights.com');
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

    it.each([
      '/admin/svg-editor',
      '/admin/crm',
      '/admin/catalog',
      '/admin/plans',
    ] as const)(
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
        const request = new NextRequest('http://localhost/admin/svg-editor');
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
        const request = new NextRequest('http://localhost/admin/svg-editor');
        const response = await proxy(request as unknown as NextRequest);
        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
      } finally {
        process.env.DEV_AUTH_BYPASS = prevBypass;
        setNodeEnv(prevNode);
      }
    });

    it('should redirect retired /portal/svg-catalog to /products/ (Phase 7 Stage B)', async () => {
      const request = new NextRequest('http://localhost/portal/svg-catalog');
      const response = await proxy(request as unknown as NextRequest);
      // Proxy uses NextResponse.redirect (307); permanent 308 lives in next.config.
      expect([307, 308]).toContain(response.status);
      expect(response.headers.get('location')).toMatch(/\/products\/?$/);
    });

    it('should redirect retired /portal/svg-catalog/[slug] to /products/', async () => {
      const request = new NextRequest('http://localhost/portal/svg-catalog/side-table-001');
      const response = await proxy(request as unknown as NextRequest);
      expect([307, 308]).toContain(response.status);
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

    it('detects Supabase and legacy Appwrite session cookies', () => {
      expect(
        hasSessionAuthCookies([{ name: 'sb-project-auth-token', value: 'x' }]),
      ).toBe(true);
      expect(
        hasSessionAuthCookies([{ name: 'a_session_legacy', value: 'x' }]),
      ).toBe(true);
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
    it('classifies member write APIs', () => {
      expect(isMemberOnlyWriteApi('/api/plans')).toBe(true);
      expect(isMemberOnlyWriteApi('/api/plans/abc')).toBe(true);
      expect(isMemberOnlyWriteApi('/api/admin/features')).toBe(true);
      expect(isMemberOnlyWriteApi('/api/Planner/projects')).toBe(false);
      expect(isMemberOnlyWriteApi('/api/Studio/furniture')).toBe(false);
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
  });
});
