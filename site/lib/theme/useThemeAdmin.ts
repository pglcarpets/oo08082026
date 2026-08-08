"use client";

/**
 * useThemeAdmin — Phase 12
 *
 * Admin hook for managing theme presets. Lists available presets,
 * shows which is active, and allows switching the active theme.
 */

import { useState, useEffect, useCallback } from "react";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";

export type ThemePresetSummary = {
  id: string;
  name: string;
  description: string;
  tokenCount: number;
  isActive: boolean;
};

export type ThemeAdminState = {
  presets: ThemePresetSummary[];
  activeThemeId: string | null;
  isLoading: boolean;
  isSwitching: boolean;
  error: string | null;
  switchTheme: (presetId: string) => Promise<boolean>;
  refresh: () => void;
};

export function useThemeAdmin(): ThemeAdminState {
  const [presets, setPresets] = useState<ThemePresetSummary[]>([]);
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPresets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/theme/manage/");
      if (!res.ok) {throw new Error(`HTTP ${res.status}`);}
      const data = await res.json();
      setPresets(data.presets ?? []);
      setActiveThemeId(data.activeThemeId ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load presets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/theme/manage/")
      .then((res) => {
        if (!res.ok) {throw new Error(`HTTP ${res.status}`);}
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setPresets(data.presets ?? []);
          setActiveThemeId(data.activeThemeId ?? null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const switchTheme = useCallback(async (presetId: string): Promise<boolean> => {
    setIsSwitching(true);
    setError(null);
    try {
      const res = await browserApiFetch(apiPath("/api/theme/manage/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setActiveThemeId(presetId);
      setPresets((prev) =>
        prev.map((p) => ({ ...p, isActive: p.id === presetId })),
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch theme");
      return false;
    } finally {
      setIsSwitching(false);
    }
  }, []);

  return {
    presets,
    activeThemeId,
    isLoading,
    isSwitching,
    error,
    switchTheme,
    refresh: loadPresets,
  };
}
