import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as providerChainType0 from "@/lib/ai/providerChain";

const mockFetch = vi.hoisted(() => vi.fn());

vi.mock('@/lib/env.server', () => ({
  env: {
    OPENROUTER_API_KEY_PRIMARY: 'primary-key',
    OPENROUTER_API_KEY_BACKUP: 'backup-key',
    OPENROUTER_MODEL: 'test-model',
    GEMINI_API_KEY: 'gemini-key',
    GEMINI_MODEL: 'gemini-model',
  },
}));

vi.mock('@/lib/siteUrl', () => ({
  SITE_URL: 'https://test-site.com',
}));

describe('providerChain', () => {
  let providerChain: typeof providerChainType0;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    providerChain = await import('@/lib/ai/providerChain');
  });

  it('should return correct Bedrock url', () => {
    expect(providerChain.getBedrockMantleBaseUrl('us-east-1')).toBe(
      'https://bedrock-mantle.us-east-1.api.aws/v1'
    );
  });

  it('should resolve provider chain from environment keys', () => {
    const chain = providerChain.resolveProviderChain();
    expect(chain).toHaveLength(3);
    expect(chain[0]).toEqual({
      provider: 'gemini',
      apiKey: 'gemini-key',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      model: 'gemini-model',
    });
    expect(chain[1]).toEqual({
      provider: 'openrouter',
      apiKey: 'primary-key',
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://test-site.com',
        'X-Title': 'One&Only',
      },
      model: 'test-model',
    });
    expect(chain[2].apiKey).toBe('backup-key');
  });

  it('should request OpenAI compatible text successfully (non-streaming)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Hello, visual designer!',
            },
          },
        ],
      }),
    });

    const provider = providerChain.resolveProviderChain()[1];
    const res = await providerChain.requestProviderText(
      provider,
      [{ role: 'user', content: 'Hi' }],
      { temperature: 0.2 },
    );

    expect(res).toBe('Hello, visual designer!');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('should stream OpenAI compatible text', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\ndata: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
          ),
        );
        controller.close();
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      body: stream,
    });

    const provider = providerChain.resolveProviderChain()[0];
    const deltas: string[] = [];
    const res = await providerChain.requestProviderText(
      provider,
      [{ role: 'user', content: 'Hi' }],
      {
        stream: true,
        onDelta: (delta) => deltas.push(delta),
      },
    );

    expect(res).toBe('Hello');
    expect(deltas.join('')).toBe('Hello');
  });

  it('should throw when provider responds with error status', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'provider down',
    });

    const provider = providerChain.resolveProviderChain()[1];
    await expect(providerChain.requestProviderText(provider, [])).rejects.toThrow(
      'provider down',
    );
  });

  it('should support json response format flag', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"ok":true}' } }],
      }),
    });

    const provider = providerChain.resolveProviderChain()[1];
    const res = await providerChain.requestProviderText(
      provider,
      [{ role: 'user', content: 'json please' }],
      { jsonMode: true },
    );

    expect(res).toBe('{"ok":true}');
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.body).toContain('"response_format"');
  });
});
