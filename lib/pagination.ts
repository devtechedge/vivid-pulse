import { clampPageSize } from './validation';

export function sliceByCursor<T extends { id: string }>(
  items: T[],
  cursor: string | undefined,
  limit: number,
): { page: T[]; nextCursor: string | null } {
  const size = clampPageSize(limit);
  let startIndex = 0;
  if (cursor) {
    const found = items.findIndex((item) => item.id === cursor);
    if (found !== -1) startIndex = found + 1;
  }
  const page = items.slice(startIndex, startIndex + size);
  const nextCursor = page.length === size ? page[page.length - 1].id : null;
  return { page, nextCursor };
}
