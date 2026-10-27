import { describe, expect, it } from 'vitest'
import { pageItems, rowRange } from '@/utils/pagination'

describe('pagination', () => {
  it('collapses long page lists with ellipses', () => {
    expect(pageItems(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pageItems(6, 19)).toEqual([1, 'ellipsis-start', 5, 6, 7, 'ellipsis-end', 19])
    expect(pageItems(1, 19)).toEqual([1, 2, 'ellipsis-end', 19])
    expect(pageItems(1, 0)).toEqual([])
  })

  it('computes the visible row range including a short last page', () => {
    expect(rowRange(2, 10, 10, 926)).toEqual({ first: 11, last: 20 })
    expect(rowRange(93, 10, 6, 926)).toEqual({ first: 921, last: 926 })
    expect(rowRange(1, 10, 0, 0)).toEqual({ first: 0, last: 0 })
  })
})
