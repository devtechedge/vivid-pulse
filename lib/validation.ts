const USERNAME_RE = /^[a-z0-9_]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_BIO_LENGTH = 150;
export const MAX_FEED_PAGE = 50;

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): ParseResult<string> {
  const value = normalizeHandle(raw);
  if (!USERNAME_RE.test(value)) {
    return {
      ok: false,
      error: 'Username must be 3–30 characters (letters, numbers, underscore).',
    };
  }
  return { ok: true, value };
}

export function validateEmail(raw: string): ParseResult<string> {
  const value = normalizeHandle(raw);
  if (!EMAIL_RE.test(value) || value.length > 255) {
    return { ok: false, error: 'Enter a valid email address.' };
  }
  return { ok: true, value };
}

export function validatePassword(raw: string): ParseResult<string> {
  if (typeof raw !== 'string' || raw.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (raw.length > 128) {
    return { ok: false, error: 'Password is too long.' };
  }
  return { ok: true, value: raw };
}

export function clampBio(raw: string, max = MAX_BIO_LENGTH): string {
  return raw.trim().slice(0, max);
}

export function clampPageSize(limit: number, fallback = 5): number {
  if (!Number.isFinite(limit)) return fallback;
  return Math.max(1, Math.min(Math.floor(limit), MAX_FEED_PAGE));
}
