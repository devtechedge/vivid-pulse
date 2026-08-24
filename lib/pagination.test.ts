import { describe, it, expect } from 'vitest';
import { sliceByCursor } from './pagination';

const items = Array.from({ length: 6 }, (_, i) => ({ id: `post-${i + 1}` }));

describe('sliceByCursor', () => {
  it('returns the first page and a next cursor', () => {
    const { page, nextCursor } = sliceByCursor(items, undefined, 2);
    expect(page.map((p) => p.id)).toEqual(['post-1', 'post-2']);
    expect(nextCursor).toBe('post-2');
  });

  it('advances from the cursor', () => {
    const { page, nextCursor } = sliceByCursor(items, 'post-2', 2);
    expect(page.map((p) => p.id)).toEqual(['post-3', 'post-4']);
    expect(nextCursor).toBe('post-4');
  });

  it('returns a null cursor on the last partial page', () => {
    const { page, nextCursor } = sliceByCursor(items, 'post-4', 2);
    expect(page.map((p) => p.id)).toEqual(['post-5', 'post-6']);
    expect(nextCursor).toBe('post-6');
    const last = sliceByCursor(items, 'post-6', 2);
    expect(last.page).toEqual([]);
    expect(last.nextCursor).toBeNull();
  });

  it('ignores an unknown cursor and starts at 0', () => {
    const { page } = sliceByCursor(items, 'missing', 2);
    expect(page.map((p) => p.id)).toEqual(['post-1', 'post-2']);
  });
});
