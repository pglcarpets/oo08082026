import { describe, it, expect, vi } from 'vitest';
import OpengraphImage, { alt, size, contentType } from '@/app/(site)/opengraph-image';
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

describe('app/(site)/opengraph-image.tsx', () => {
  it('returns ImageResponse with brand metadata', () => {
    const result = OpengraphImage();

    expect(alt).toBe(SITE_BRAND.defaultTitle);
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe('image/png');
    expect(result).toHaveProperty('element');
    expect(result).toHaveProperty('options');
  });
});
