import { insertEvent } from '@/lib/audit/auditRepository'
import { isAuditTeamId, userBelongsToTeam } from '@/lib/audit/teamAccess'
import { isAppAdmin } from '@/lib/auth/roles'
import { rateLimit } from "@/lib/rateLimit"
import { createAuthServerClient } from "@/platform/supabase/server"
import { validateCsrfRequest } from "@/lib/security/csrf"
import { CSRF_REJECTION_HEADER_NAME } from "@/lib/security/csrfConstants"
import { success, error, rateLimitedError } from "@/features/shared/api/apiResponse"
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError"

function getRequestIp(req: Request): string {
  // Prefer edge-set client IP; fall back to first XFF hop only.
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "127.0.0.1"
  )
}

export async function POST(req: Request) {
  try {
    const ip = getRequestIp(req)
    const limitRes = await rateLimit(`audit:${ip}`, 30, 60 * 1000)
    if (!limitRes.success) {
      return rateLimitedError('Too many requests', limitRes.reset)
    }

    const supabase = await createAuthServerClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const userId = authData.user?.id?.trim() || ""
    if (authError || !userId) {
      return error(new ApiError(401, API_ERROR_CODES.AUTH_REQUIRED, 'Unauthorized'))
    }

    const isCsrfValid = await validateCsrfRequest(req);
    if (!isCsrfValid) {
      return error(
        new ApiError(
          403,
          API_ERROR_CODES.CSRF_FAILED,
          "Invalid or missing CSRF token",
        ),
        { headers: { [CSRF_REJECTION_HEADER_NAME]: "1" } },
      );
    }

    const body = await req.json().catch(() => ({}))
    const { team_id, action, target_type, target_id, metadata } = body

    if (
      typeof team_id !== "string" ||
      typeof action !== "string" ||
      typeof target_type !== "string"
    ) {
      return error(
        new ApiError(
          400,
          API_ERROR_CODES.MISSING_REQUIRED_FIELD,
          'Missing required fields',
        ),
      )
    }

    const normalizedTeamId = team_id.trim().slice(0, 120)
    if (!normalizedTeamId || !isAuditTeamId(normalizedTeamId)) {
      return error(
        new ApiError(400, API_ERROR_CODES.INVALID_INPUT, 'Invalid team_id'),
      )
    }

    const actor = authData.user
    const isAdmin = isAppAdmin(actor)
    if (!isAdmin) {
      const isMember = await userBelongsToTeam(userId, normalizedTeamId)
      if (!isMember) {
        return error(
          new ApiError(403, API_ERROR_CODES.INSUFFICIENT_PERMISSIONS, 'Forbidden'),
        )
      }
    }

    await insertEvent({
      team_id: normalizedTeamId,
      actor_id: userId.slice(0, 120),
      action: action.trim().slice(0, 120),
      target_type: target_type.trim().slice(0, 120),
      target_id: typeof target_id === "string" ? target_id.trim().slice(0, 120) : null,
      metadata: metadata && typeof metadata === "object" ? metadata : {}
    })

    return success({})
  } catch (err) {
    console.error('[POST /api/audit] error:', err)
    return error(
      new ApiError(
        500,
        API_ERROR_CODES.INTERNAL_ERROR,
        'Failed to record audit event',
      ),
    )
  }
}