export const PASSWORD_SALT = 'vividpulse_salt_2026';
export const SESSION_COOKIE = 'vp_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;
export const FALLBACK_SESSION_SECRET = 'vividpulse_signing_secret_2026';

export function getSessionSecret(): string {
  return process.env.SESSION_SECRET?.trim() || FALLBACK_SESSION_SECRET;
}

async function sha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function hashPassword(password: string): Promise<string> {
  return sha256Hex(password + PASSWORD_SALT);
}

export async function generateSessionToken(
  userId: string,
  now = Date.now(),
  secret = getSessionSecret(),
): Promise<string> {
  const expiresAt = now + SESSION_TTL_MS;
  const data = `${userId}:${expiresAt}`;
  const signature = await sha256Hex(data + secret);
  return `${userId}:${expiresAt}:${signature}`;
}

export async function verifySessionToken(
  token: string,
  now = Date.now(),
  secret = getSessionSecret(),
): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(':');
  if (parts.length !== 3) return null;

  const [userId, expiresAtStr, signature] = parts;
  if (!userId || !signature) return null;

  const expiresAt = parseInt(expiresAtStr, 10);
  if (!Number.isFinite(expiresAt) || expiresAt < now) return null;

  const expected = await sha256Hex(`${userId}:${expiresAt}` + secret);
  if (!safeEqualHex(signature, expected)) return null;
  return userId;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}
