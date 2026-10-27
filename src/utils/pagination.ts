export type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

/**
 * Compact page list, first and last always visible:
 * pageItems(6, 20) → [1, 'ellipsis-start', 5, 6, 7, 'ellipsis-end', 20]
 */
export function pageItems(current: number, total: number, siblings = 1): PageItem[] {
  if (total <= 0) return []
  if (total <= 5 + siblings * 2) return Array.from({ length: total }, (_, i) => i + 1)
  const page = Math.min(Math.max(1, current), total)
  const start = Math.max(2, page - siblings)
  const end = Math.min(total - 1, page + siblings)
  const items: PageItem[] = [1]
  if (start > 2) items.push('ellipsis-start')
  for (let i = start; i <= end; i++) items.push(i)
  if (end < total - 1) items.push('ellipsis-end')
  items.push(total)
  return items
}

/** 1-based inclusive row range shown on a page. */
export function rowRange(page: number, pageSize: number, rowsOnPage: number, total: number) {
  if (!total || !rowsOnPage) return { first: 0, last: 0 }
  const first = (page - 1) * pageSize + 1
  return { first, last: Math.min(total, first + rowsOnPage - 1) }
}
