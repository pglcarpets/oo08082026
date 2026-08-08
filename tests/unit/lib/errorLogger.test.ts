import { describe, it, expect, vi, afterEach } from 'vitest';
import { logClientError } from '../../../site/lib/errorLogger';

describe('errorLogger', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should return false if fetch is undefined', async () => {
    vi.stubGlobal('fetch', undefined);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await logClientError({ error: new Error('test error') });

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should return true on successful post request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('window', { location: { href: 'https://example.com/page' } });
    vi.stubGlobal('navigator', { userAgent: 'test-agent' });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('test error');
    const result = await logClientError({
      error,
      label: 'custom-label',
      componentStack: 'CompStack',
      additionalInfo: { extra: 'info' },
    });

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'test error',
        stack: error.stack,
        componentStack: 'CompStack',
        url: 'https://example.com/page',
        userAgent: 'test-agent',
        label: 'custom-label',
        extra: 'info',
      }),
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should return false if endpoint returns non-ok status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal('fetch', mockFetch);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await logClientError({ error: 'string error' });

    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith('[client-utility] Error logger endpoint returned non-ok status: 500');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle fetch throw / network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await logClientError({ error: new Error('test') });

    expect(result).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      '[client-utility] Failed to transmit error stack to endpoint:',
      expect.any(Error)
    );
  });
});
