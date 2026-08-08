import { describe, it, expect } from 'vitest';
import { routeHasContactTeaser, routeSuppressesFloatingQuickContact } from '@/features/crm/contactSurfaces';

describe('contactSurfaces Utilities', () => {
  describe('routeHasContactTeaser', () => {
    it('returns false for null or undefined pathname', () => {
      expect(routeHasContactTeaser(null)).toBe(false);
      expect(routeHasContactTeaser(undefined as unknown as string | null)).toBe(false);
    });

    it('returns true for exact matching routes in contact teaser list', () => {
      expect(routeHasContactTeaser('/')).toBe(true);
      expect(routeHasContactTeaser('/about')).toBe(true);
      expect(routeHasContactTeaser('/planning')).toBe(true);
      expect(routeHasContactTeaser('/showrooms')).toBe(true);
    });

    it('returns true for routes starting with /products/', () => {
      expect(routeHasContactTeaser('/products/chairs')).toBe(true);
      expect(routeHasContactTeaser('/products/desks/deskpro')).toBe(true);
    });

    it('returns false for non-matching routes', () => {
      expect(routeHasContactTeaser('/admin')).toBe(false);
      expect(routeHasContactTeaser('/dashboard')).toBe(false);
      expect(routeHasContactTeaser('/not-a-route')).toBe(false);
    });
  });

  describe('routeSuppressesFloatingQuickContact', () => {
    it('returns false for null or undefined pathname', () => {
      expect(routeSuppressesFloatingQuickContact(null)).toBe(false);
      expect(routeSuppressesFloatingQuickContact(undefined as unknown as string | null)).toBe(false);
    });

    it('returns true for exact matching suppressed routes', () => {
      expect(routeSuppressesFloatingQuickContact('/compare')).toBe(true);
      expect(routeSuppressesFloatingQuickContact('/contact')).toBe(true);
      expect(routeSuppressesFloatingQuickContact('/quote-cart')).toBe(true);
    });

    it('returns false for other routes', () => {
      expect(routeSuppressesFloatingQuickContact('/')).toBe(false);
      expect(routeSuppressesFloatingQuickContact('/about')).toBe(false);
      expect(routeSuppressesFloatingQuickContact('/products/chairs')).toBe(false);
    });
  });
});
