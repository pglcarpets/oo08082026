import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { THEME_PRESETS, getPresetById } from "@/lib/theme/presets";
import { getActiveThemeId, setActiveThemeId } from "@/lib/theme/activeThemeId";
import { enforceAdminRateLimit, requireAdminSession } from "@/app/api/admin/_lib/server";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { CSRF_REJECTION_HEADER_NAME } from "@/lib/security/csrfConstants";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";
import { error as apiError } from "@/features/shared/api/apiResponse";

export const dynamic = "force-dynamic";

/**
 * Phase 12 — Theme Management API
 *
 * GET  /api/theme/manage/ → list all available presets
 * POST /api/theme/manage/ → activate a preset by ID
 *
 * In production, POST would write to the database (Drizzle/Supabase).
 * For now, it validates the preset and returns what would be stored.
 */

// Active theme id is shared via lib/theme/activeThemeId (production: DB-backed).

export async function GET(req: NextRequest) {
  const rateError = await enforceAdminRateLimit(req, "theme-manage:get");
  if (rateError) {return rateError;}

  const authError = await requireAdminSession();
  if (authError) {return authError;}

  const activeThemeId = getActiveThemeId();
  const presets = THEME_PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    tokenCount: Object.keys(p.tokens).length,
    isActive: p.id === activeThemeId,
  }));

  return NextResponse.json({
    activeThemeId,
    presets,
    totalPresets: presets.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const rateError = await enforceAdminRateLimit(request, "theme-manage:post", 20);
    if (rateError) {return rateError;}

    const authError = await requireAdminSession();
    if (authError) {return authError;}

    const isCsrfValid = await validateCsrfRequest(request);
    if (!isCsrfValid) {
      return apiError(
        ApiError.fromCode(
          API_ERROR_CODES.CSRF_FAILED,
          "Invalid or missing CSRF token",
        ),
        { headers: { [CSRF_REJECTION_HEADER_NAME]: "1" } },
      );
    }

    const body = await request.json();
    const { presetId } = body as { presetId?: string };

    if (!presetId || typeof presetId !== "string") {
      return NextResponse.json(
        { error: "Missing required field: presetId" },
        { status: 400 },
      );
    }

    const preset = getPresetById(presetId);
    if (!preset) {
      return NextResponse.json(
        { error: `Unknown preset: ${presetId}`, availablePresets: THEME_PRESETS.map((p) => p.id) },
        { status: 404 },
      );
    }

    // Activate the preset (in production: write to DB)
    setActiveThemeId(presetId);

    return NextResponse.json({
      success: true,
      activated: {
        id: preset.id,
        name: preset.name,
        tokenCount: Object.keys(preset.tokens).length,
      },
      message: `Theme "${preset.name}" is now active. Clients will pick up the change on next fetch.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
