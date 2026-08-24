import { describe, it, expect } from 'vitest';
import {
  clampBio,
  clampPageSize,
  MAX_BIO_LENGTH,
  MAX_FEED_PAGE,
  validateEmail,
  validatePassword,
  validateUsername,
} from './validation';

describe('validateUsername', () => {
  it('accepts seeded demo handles', () => {
    expect(validateUsername('alex_vivid')).toEqual({ ok: true, value: 'alex_vivid' });
    expect(validateUsername('Elena_Pixels')).toEqual({ ok: true, value: 'elena_pixels' });
  });

  it('rejects short, spaced, or punctuated names', () => {
    expect(validateUsername('ab').ok).toBe(false);
    expect(validateUsername('alex vivid').ok).toBe(false);
    expect(validateUsername('alex@pulse').ok).toBe(false);
    expect(validateUsername('../etc/passwd').ok).toBe(false);
  });
});

describe('validateEmail', () => {
  it('accepts a normal address', () => {
    expect(validateEmail('Alex@vividpulse.com')).toEqual({
      ok: true,
      value: 'alex@vividpulse.com',
    });
  });

  it('rejects missing at-sign or domain', () => {
    expect(validateEmail('alex').ok).toBe(false);
    expect(validateEmail('alex@').ok).toBe(false);
    expect(validateEmail('not-an-email').ok).toBe(false);
  });
});

describe('validatePassword', () => {
  it('enforces the demo minimum of 6 characters', () => {
    expect(validatePassword('12345').ok).toBe(false);
    expect(validatePassword('password123')).toEqual({ ok: true, value: 'password123' });
  });
});

describe('clampBio / clampPageSize', () => {
  it('trims and caps bio length', () => {
    expect(clampBio('  hello  ')).toBe('hello');
    expect(clampBio('x'.repeat(200)).length).toBe(MAX_BIO_LENGTH);
  });

  it('clamps feed page size', () => {
    expect(clampPageSize(0)).toBe(1);
    expect(clampPageSize(999)).toBe(MAX_FEED_PAGE);
    expect(clampPageSize(Number.NaN)).toBe(5);
  });
});
