import {
  CSRF_HEADER_NAME,
  CSRF_REJECTION_HEADER_NAME,
} from "@/lib/security/csrfConstants";

let csrfTokenPromise: Promise<string> | null = null;

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Normalize `/api/...` paths to include a trailing slash (Next.js `trailingSlash: true`). */
export function apiPath(path: string): string {
  if (!path.startsWith("/api/")) {return path;}
  const queryIndex = path.indexOf("?");
  const base = queryIndex === -1 ? path : path.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : path.slice(queryIndex + 1);
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return query ? `${normalized}?${query}` : normalized;
}

export function invalidateCsrfToken(): void {
  csrfTokenPromise = null;
}

export async function ensureCsrfToken(): Promise<string> {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(apiPath("/api/csrf"), {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`CSRF bootstrap failed (${response.status})`);
        }
        const body = (await response.json()) as { token?: string };
        if (!body.token) {
          throw new Error("CSRF bootstrap response missing token");
        }
        return body.token;
      })
      .catch((error) => {
        csrfTokenPromise = null;
        throw error;
      });
  }
  return csrfTokenPromise;
}

export async function browserApiFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const url = apiPath(input);
  const execute = async (csrfToken?: string): Promise<Response> => {
    const headers = new Headers(init.headers);
    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
    const headerEntries = Array.from(headers.entries());
    const normalizedHeaders =
      headerEntries.length > 0 ? Object.fromEntries(headerEntries) : undefined;

    return fetch(url, {
      ...init,
      method,
      headers: normalizedHeaders,
      credentials: init.credentials ?? "include",
    });
  };

  if (!MUTATING_METHODS.has(method)) {
    return execute();
  }

  const token = await ensureCsrfToken();
  let response = await execute(token);
  if (response.headers.get(CSRF_REJECTION_HEADER_NAME) !== "1") {
    return response;
  }

  invalidateCsrfToken();
  const retryToken = await ensureCsrfToken();
  response = await execute(retryToken);
  if (response.headers.get(CSRF_REJECTION_HEADER_NAME) === "1") {
    invalidateCsrfToken();
  }
  return response;
}
