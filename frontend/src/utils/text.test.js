import { describe, expect, it } from 'vitest'
import { capitalize, includesText, listWords, pluralize } from './text.js'

describe('text helpers', () => {
  it('pluralizes by count', () => {
    expect(pluralize(1, 'employee')).toBe('employee')
    expect(pluralize(3, 'employee')).toBe('employees')
    expect(pluralize(2, 'person', 'people')).toBe('people')
  })

  it('joins words like a sentence', () => {
    expect(listWords([])).toBe('')
    expect(listWords(['a'])).toBe('a')
    expect(listWords(['a', 'b', 'c'])).toBe('a, b and c')
  })

  it('capitalizes and searches without caring about case', () => {
    expect(capitalize('manager')).toBe('Manager')
    expect(includesText('Customer Portal', 'portal')).toBe(true)
    expect(includesText('Customer Portal', 'billing')).toBe(false)
  })
})
