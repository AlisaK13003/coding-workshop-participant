import { describe, expect, it } from 'vitest'
import { getProjectHealth, getScheduleHealth, isProjectOverBudget } from './schedule.js'

const TODAY = new Date('2026-10-14T12:00:00')
const project = (overrides = {}) => ({
  start_date: '2026-09-01',
  end_date: '2026-12-31',
  milestones: { completed: 1, total: 4, overdue: 0 },
  ...overrides,
})
const milestones = (overdue, completed = 1, total = 4) => ({ milestones: { completed, total, overdue } })

describe('getScheduleHealth', () => {
  it('goes by late milestones: none on track, one needs attention, several urgent', () => {
    expect(getScheduleHealth(project(milestones(0)), TODAY)).toBe('Green')
    expect(getScheduleHealth(project(milestones(1)), TODAY)).toBe('Amber')
    expect(getScheduleHealth(project(milestones(2)), TODAY)).toBe('Red')
  })

  it('is urgent once past the end date with work left, and on track when everything is done', () => {
    expect(getScheduleHealth(project({ end_date: '2026-10-01' }), TODAY)).toBe('Red')
    expect(getScheduleHealth(project({ end_date: '2026-10-01', ...milestones(0, 4, 4) }), TODAY)).toBe('Green')
  })

  it('falls back to elapsed time without milestones (<50% / 50–75% / more)', () => {
    const noMilestones = (start, end) => project({ start_date: start, end_date: end, ...milestones(0, 0, 0) })
    expect(getScheduleHealth(noMilestones('2026-10-01', '2026-12-31'), TODAY)).toBe('Green')
    expect(getScheduleHealth(noMilestones('2026-09-01', '2026-11-10'), TODAY)).toBe('Amber')
    expect(getScheduleHealth(noMilestones('2026-09-01', '2026-10-20'), TODAY)).toBe('Red')
  })
})

describe('getProjectHealth', () => {
  it('raises health one step when over budget', () => {
    const over = { budget: 10000, cost: 12000 }
    expect(getProjectHealth(project(over), TODAY)).toBe('Amber')
    expect(getProjectHealth(project({ ...over, ...milestones(1) }), TODAY)).toBe('Red')
    expect(getProjectHealth(project({ ...over, ...milestones(2) }), TODAY)).toBe('Red')
  })

  it('ignores budget when it is within budget or unknown (employees never receive it)', () => {
    expect(getProjectHealth(project({ budget: 10000, cost: 10000 }), TODAY)).toBe('Green')
    expect(getProjectHealth(project(), TODAY)).toBe('Green')
    expect(isProjectOverBudget(project())).toBe(false)
  })
})
