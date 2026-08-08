import { describe, it, expect, vi } from 'vitest';
import TwitterImage, { alt, size, contentType } from '@/app/(site)/twitter-image';
import { SITE_BRAND } from '@/features/site/data/brand';

vi.mock('next/og', () => ({
  ImageResponse: class MockImageResponse {
    element: unknown;
    options: unknown;

    constructor(element: unknown, options: unknown) {
      this.element = element;
      this.options = options;
    }
  },
}));

describe('app/(site)/twitter-image.tsx', () => {
  it('reuses opengraph image exports', () => {
    const result = TwitterImage();

    expect(alt).toBe(SITE_BRAND.defaultTitle);
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe('image/png');
    expect(result).toHaveProperty('element');
    expect(result).toHaveProperty('options');
  });
});
