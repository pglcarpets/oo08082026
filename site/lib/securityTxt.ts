/**
 * RFC 9116 security.txt body — kept in sync with:
 * - site/public/.well-known/security.txt
 * - site/public/security.txt
 * - workers/oando-worker-proxy (edge fallback)
 */
export const SECURITY_TXT_BODY = `# One&Only (oando.co.in) - security disclosure contact (RFC 9116)
# Prefer responsible disclosure for security issues only (not sales or support).

Contact: mailto:sales@oando.co.in
Contact: tel:+91-98356-30940
Expires: 2027-08-09T00:00:00.000Z
Preferred-Languages: en, hi
Canonical: https://oando.co.in/.well-known/security.txt
Policy: https://oando.co.in/privacy/
Hiring: https://oando.co.in/career/
`;

export function securityTxtResponse(): Response {
  return new Response(SECURITY_TXT_BODY, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
