import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';

describe('LanguageSwitcher Component', () => {
  let mockCookieStore: Record<string, string> = {};
  const originalCookie = Object.getOwnPropertyDescriptor(document, 'cookie');
  const originalReload = window.location.reload;
  const mockReload = vi.fn();

  beforeEach(() => {
    mockCookieStore = {};

    Object.defineProperty(document, 'cookie', {
      get: () =>
        Object.entries(mockCookieStore)
          .map(([k, v]) => `${k}=${v}`)
          .join('; '),
      set: (val: string) => {
        const [kv] = val.split(';');
        const [k, v] = kv.split('=');
        mockCookieStore[k.trim()] = v.trim();
      },
      configurable: true,
    });

    Object.defineProperty(window, 'location', {
      value: {
        reload: mockReload,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalCookie) {
      Object.defineProperty(document, 'cookie', originalCookie);
    }
    Object.defineProperty(window, 'location', {
      value: {
        reload: originalReload,
      },
      writable: true,
      configurable: true,
    });
  });

  it('defaults to en when no cookie is set', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByLabelText('Select Language') as HTMLSelectElement;
    expect(select.value).toBe('en');
  });

  it('reads NEXT_LOCALE cookie on mount and selects matching language', async () => {
    mockCookieStore['NEXT_LOCALE'] = 'hi';

    render(<LanguageSwitcher />);

    await waitFor(() => {
      const select = screen.getByLabelText('Select Language') as HTMLSelectElement;
      expect(select.value).toBe('hi');
    });
  });

  it('sets NEXT_LOCALE cookie and reloads window on change select option', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByLabelText('Select Language') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'fr' } });

    expect(mockCookieStore['NEXT_LOCALE']).toBe('fr');
    expect(mockReload).toHaveBeenCalled();
    expect(select.value).toBe('fr');
  });

  it('renders compact header variant with all marketing locales', () => {
    render(<LanguageSwitcher variant="header" />);

    const select = screen.getByLabelText('Select Language') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toEqual(['en', 'hi', 'fr', 'de', 'es']);
  });

  it('keeps header language control at 44px touch height', () => {
    render(<LanguageSwitcher variant="header" />);

    const select = screen.getByLabelText('Select Language') as HTMLSelectElement;
    expect(select.className).toMatch(/min-h-11/);
    expect(select.className).toMatch(/touch-manipulation/);
  });

  it('keeps footer language control at 44px touch height', () => {
    render(<LanguageSwitcher variant="footer" />);

    const select = screen.getByLabelText('Select Language') as HTMLSelectElement;
    expect(select.className).toMatch(/min-h-11/);
  });
});
