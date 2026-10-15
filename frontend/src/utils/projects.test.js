import { describe, expect, it } from 'vitest'
import { validateProjectForm } from './projects.js'

const VALID = { name: 'Customer Portal', manager_id: 2, start_date: '2026-10-01', end_date: '2026-12-31', budget: '50000' }

describe('validateProjectForm (same rules and wording as the server)', () => {
  it('accepts a complete form', () => {
    expect(validateProjectForm(VALID, { needsManager: true })).toEqual({})
  })

  it('requires every field, and a name that is more than spaces', () => {
    expect(validateProjectForm({ name: '   ' }, { needsManager: true })).toEqual({
      name: 'This field is required.',
      manager_id: 'This field is required.',
      start_date: 'This field is required.',
      end_date: 'This field is required.',
      budget: 'This field is required.',
    })
  })

  it('only requires a manager when asked to (editing keeps the current one)', () => {
    expect(validateProjectForm({ ...VALID, manager_id: undefined })).toEqual({})
  })

  it('limits the name to 200 characters, ignoring spaces around it', () => {
    expect(validateProjectForm({ ...VALID, name: ` ${'x'.repeat(200)} ` })).toEqual({})
    expect(validateProjectForm({ ...VALID, name: 'x'.repeat(201) }).name).toBe('Must be at most 200 characters.')
  })

  it('needs the end date on or after the start date', () => {
    expect(validateProjectForm({ ...VALID, end_date: '2026-09-30' }).end_date).toBe('Must be on or after the start date.')
    expect(validateProjectForm({ ...VALID, end_date: VALID.start_date })).toEqual({})
  })

  it('checks the budget is a number from zero up to what the database holds', () => {
    expect(validateProjectForm({ ...VALID, budget: '0' })).toEqual({})
    expect(validateProjectForm({ ...VALID, budget: 'abc' }).budget).toBe('Must be a number.')
    expect(validateProjectForm({ ...VALID, budget: '-5' }).budget).toBe('Must be zero or more.')
    expect(validateProjectForm({ ...VALID, budget: '9999999999.99' })).toEqual({})
    expect(validateProjectForm({ ...VALID, budget: '10000000000' }).budget).toBe('Must be less than 10,000,000,000.')
  })
})
