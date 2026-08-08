import { NextResponse } from "next/server";
import { stripCatalogTokens } from "../../../../lib/theme/catalogTokenKeys";
import { getPresetById, getDefaultPreset } from "../../../../lib/theme/presets";
import { getActiveThemeId } from "@/lib/theme/activeThemeId";
import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";

export const dynamic = "force-dynamic";

/**
 * Phase 11/12 — Active Theme API
 *
 * Returns UI chrome tokens for ThemeProvider (text, accent, border, fonts).
 *
 * Catalog block rendering tokens (--block-surface, --block-seat, …) are owned
 * by lib/catalog/styles and must NOT be served here. ThemeProvider also strips
 * any catalog keys defensively before injecting into :root.
 *
 * In production, the active preset ID comes from the database.
 */

export async function GET(request: Request) {
  const rateError = await enforcePublicApiRateLimit(request, "theme-active:get", 30);
  if (rateError) {return rateError;}

  const activeThemeId = getActiveThemeId();
  const preset = getPresetById(activeThemeId) ?? getDefaultPreset();

  return NextResponse.json({
    id: `00000000-0000-0000-0000-000000000001`,
    name: preset.id,
    payload_jsonb: stripCatalogTokens(preset.tokens),
    is_active: true,
  });
}
