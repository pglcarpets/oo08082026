const ANON_USER_ID_PREFIX = "anon_";
const ANON_USER_ID_PATTERN = /^anon_[a-z0-9]{16,}$/i;
const LEGACY_USER_ID_PATTERN = /^user_[a-z0-9]{7,}$/i;

export function createAnonymousUserId(): string {
  const suffix =
    globalThis.crypto?.randomUUID?.().replace(/-/g, "") ||
    `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

  return `${ANON_USER_ID_PREFIX}${suffix}`;
}

export function normalizeAnonymousUserId(value: unknown): string {
  if (typeof value !== "string") {return "";}

  const trimmed = value.trim();
  if (ANON_USER_ID_PATTERN.test(trimmed)) {return trimmed;}
  if (LEGACY_USER_ID_PATTERN.test(trimmed)) {
    return `${ANON_USER_ID_PREFIX}${trimmed.slice(5)}`;
  }

  return "";
}
