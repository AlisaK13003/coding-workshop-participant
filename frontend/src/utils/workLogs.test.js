import { describe, expect, it } from 'vitest'
import { matchesWorkLogFilters, sumCost, sumHours } from './workLogs.js'

const log = (id, workDate, { employee = 3, project = 1, milestone = 1, cost } = {}) => ({
  id,
  work_date: workDate,
  hours: 8,
  cost,
  employee: { id: employee },
  project: { id: project },
  milestone: { id: milestone },
})
const logs = [log(1, '2026-10-12', { cost: 320 }), log(2, '2026-10-13', { employee: 7, project: 2, milestone: 5 })]
const ids = (filters) => logs.filter((item) => matchesWorkLogFilters(item, filters)).map((item) => item.id)

describe('matchesWorkLogFilters', () => {
  it('keeps everything when no filter is set', () => {
    expect(ids({ from: '', to: '', employee: '', project: '', milestone: '' })).toEqual([1, 2])
  })

  it('filters by an inclusive date range and by ids from select values (strings)', () => {
    expect(ids({ from: '2026-10-13' })).toEqual([2])
    expect(ids({ to: '2026-10-12' })).toEqual([1])
    expect(ids({ employee: '7' })).toEqual([2])
    expect(ids({ project: '1', milestone: '1' })).toEqual([1])
    expect(ids({ project: '1', milestone: '5' })).toEqual([])
  })
})

describe('totals', () => {
  it('adds hours, and cost where it was sent (pay is hidden from some viewers)', () => {
    expect(sumHours(logs)).toBe(16)
    expect(sumCost(logs)).toBe(320)
  })
})
