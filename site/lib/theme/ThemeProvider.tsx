'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { BlockThemePayload} from './schema';
import { blockThemePayloadSchema } from './schema';
import { CATALOG_BLOCK_TOKEN_KEYS } from './catalogTokenKeys';

const EMPTY_FALLBACK_TOKENS: BlockThemePayload = {};

interface ThemeContextValue {
  themeName: string;
  tokens: BlockThemePayload | null;
  isLoading: boolean;
  error: Error | null;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeName: 'local-fallback',
  tokens: null,
  isLoading: true,
  error: null,
});

export const useBlockTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
  fallbackTokens?: BlockThemePayload;
  fetchEndpoint?: string; // e.g. API route that handles Supabase -> CDN fallback
}

export function ThemeProvider({
  children,
  fallbackTokens = EMPTY_FALLBACK_TOKENS,
  fetchEndpoint = '/api/theme/active/',
}: ThemeProviderProps) {
  const [tokens, setTokens] = useState<BlockThemePayload | null>(null);
  const [themeName, setThemeName] = useState<string>('local-fallback');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTheme() {
      try {
        setIsLoading(true);
        const response = await fetch(fetchEndpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch active theme');
        }

        const data = await response.json();
        const parsedPayload = blockThemePayloadSchema.parse(data.payload_jsonb);
        
        if (isMounted) {
          setTokens(parsedPayload);
          setThemeName(data.name || 'remote-theme');
        }
      } catch (err: unknown) {
        console.warn('Theme fetch failed, falling back to local tokens', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setTokens(fallbackTokens);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchTheme();

    return () => {
      isMounted = false;
    };
  }, [fetchEndpoint, fallbackTokens]);

  useEffect(() => {
    if (!tokens) {return;}

    const styleId = 'dynamic-block-theme';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const cssVars = Object.entries(tokens)
      .filter(([key]) => !CATALOG_BLOCK_TOKEN_KEYS.has(key.replace(/^--/, "")))
      .map(([key, value]) => {
        const cssKey = key.startsWith('--') ? key : `--${key}`;
        return `${cssKey}: ${value};`;
      })
      .join('\n  ');

    styleTag.textContent = cssVars ? `:root {\n  ${cssVars}\n}` : '';
  }, [tokens]);

  return (
    <ThemeContext.Provider value={{ themeName, tokens, isLoading, error }}>
      {children}
    </ThemeContext.Provider>
  );
}
