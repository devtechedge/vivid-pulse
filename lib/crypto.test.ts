import { describe, it, expect } from 'vitest';
import {
  FALLBACK_SESSION_SECRET,
  generateSessionToken,
  hashPassword,
  verifySessionToken,
} from './crypto';

describe('hashPassword', () => {
  it('is deterministic SHA-256 with the demo salt', async () => {
    const a = await hashPassword('password123');
    const b = await hashPassword('password123');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes when the password changes', async () => {
    const a = await hashPassword('password123');
    const b = await hashPassword('password124');
    expect(a).not.toBe(b);
  });
});

describe('session tokens', () => {
  const secret = FALLBACK_SESSION_SECRET;

  it('round-trips a valid user id', async () => {
    const token = await generateSessionToken('user-1', Date.now(), secret);
    await expect(verifySessionToken(token, Date.now(), secret)).resolves.toBe('user-1');
  });

  it('rejects a tampered signature', async () => {
    const token = await generateSessionToken('user-1', Date.now(), secret);
    const parts = token.split(':');
    parts[2] = 'a'.repeat(64);
    await expect(verifySessionToken(parts.join(':'), Date.now(), secret)).resolves.toBeNull();
  });

  it('rejects an expired token', async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const token = await generateSessionToken('user-1', eightDaysAgo, secret);
    await expect(verifySessionToken(token, Date.now(), secret)).resolves.toBeNull();
  });

  it('rejects a malformed token', async () => {
    await expect(verifySessionToken('not-a-token')).resolves.toBeNull();
    await expect(verifySessionToken('')).resolves.toBeNull();
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await generateSessionToken('user-1', Date.now(), 'other-secret');
    await expect(verifySessionToken(token, Date.now(), secret)).resolves.toBeNull();
  });
});
