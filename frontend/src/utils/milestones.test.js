import { describe, expect, it } from 'vitest'
import { getMilestoneHealth, MILESTONE_STATUS } from './milestones.js'

const TODAY = '2026-10-14'
const milestone = (status, endDate, members = [{ id: 3, name: 'Emery' }]) => ({ status, end_date: endDate, members })

describe('getMilestoneHealth', () => {
  it('is urgent when past its end date, or still blocked with a week or less to go', () => {
    expect(getMilestoneHealth(milestone(MILESTONE_STATUS.available, '2026-10-10'), TODAY).phase).toBe('Red')
    const blockedSoon = getMilestoneHealth(milestone(MILESTONE_STATUS.blocked, '2026-10-21'), TODAY)
    expect(blockedSoon).toEqual({ phase: 'Red', reason: 'Ends in 7 days but its prerequisites aren’t done' })
  })

  it('needs attention when blocked with more time, or when nobody is assigned', () => {
    expect(getMilestoneHealth(milestone(MILESTONE_STATUS.blocked, '2026-11-30'), TODAY).phase).toBe('Amber')
    expect(getMilestoneHealth(milestone(MILESTONE_STATUS.available, '2026-11-30', []), TODAY).phase).toBe('Amber')
  })

  it('is on track when people are on it or a review is pending', () => {
    expect(getMilestoneHealth(milestone(MILESTONE_STATUS.available, '2026-11-30'), TODAY)).toEqual({
      phase: 'Green',
      reason: '1 person working on it',
    })
    expect(getMilestoneHealth(milestone(MILESTONE_STATUS.review, '2026-10-15', []), TODAY).phase).toBe('Green')
  })
})
