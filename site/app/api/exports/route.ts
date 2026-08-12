import { NextResponse } from "next/server";
import path from "node:path";
import {
  BadRequestError,
  EXPORTS_DIR,
  decodeDataUrl,
  ensureExportsDir,
  readJsonBody,
  shortId,
  slugify,
  writeBytes,
} from "../_lib/exportsStore";
import { withAuth, type AuthContext } from "@/features/shared/api/withAuth";
import { ApiError } from "@/features/shared/api/ApiError";
import { isDevAuthBypassEnabled } from "@/lib/auth/devAuthBypass";

/**
 * POST /api/exports — create an export file (PNG/SVG/PDF) from a data URL.
 *
 * Gated (TST-S22 / AUDIT-EXPORTS-01): member-only, CSRF double-submit enforced,
 * rate-limited per IP. Exports are stored on disk only in dev (writeable FS);
 * production is read-only, so the handler refuses rather than raw-writing.
 */
export const POST = withAuth(
  async (request: Request, _auth: AuthContext) => {
    try {
      return await createExport(request);
    } catch (e) {
      if (e instanceof BadRequestError) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_INPUT", message: e.message } },
          { status: 400 },
        );
      }
      throw e;
    }
  },
  {
    role: "member",
    rateLimitScope: "exports:post",
    rateLimit: 30,
    requireCsrf: true,
  },
);

async function createExport(request: Request) {
  if (!isDevAuthBypassEnabled()) {
    // Production filesystem is read-only — refuse instead of raw-writing.
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Export storage is only available in development (DEV_AUTH_BYPASS=1).",
    );
  }

  const payload = (await readJsonBody(request)) as {
    format?: string;
    data_url?: string;
    name?: string;
  };
  const fmt = (payload.format || "png").replace(/[^a-z0-9]/gi, "") || "png";
  const dataUrl = payload.data_url;
  const name = slugify(payload.name || "export");
  if (!dataUrl) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_REQUIRED_FIELD", message: "data_url required" } },
      { status: 400 },
    );
  }
  await ensureExportsDir();
  const { raw } = decodeDataUrl(dataUrl);
  const exportId = `e_${name}_${shortId()}.${fmt}`;
  await writeBytes(path.join(EXPORTS_DIR, exportId), raw);
  return NextResponse.json({ success: true, id: exportId, url: `/api/files/exports/${exportId}` });
}
