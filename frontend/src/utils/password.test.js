import { describe, expect, it } from 'vitest'
import { passwordProblem, validatePasswordChange } from './password.js'

describe('passwordProblem (same rules as the server)', () => {
  it('accepts 8+ characters with an uppercase letter, a number and a special character', () => {
    expect(passwordProblem('Password1.')).toBeNull()
  })

  it('names everything that is missing', () => {
    expect(passwordProblem('short')).toBe('Use at least 8 characters.')
    expect(passwordProblem('password')).toBe('Include an uppercase letter, a number and a special character like . or !.')
    expect(passwordProblem('Uppercase1')).toBe('Include a special character like . or !.')
  })

  it('does not count a space as a special character', () => {
    expect(passwordProblem('Pass word1')).toBe('Include a special character like . or !.')
  })

  it('limits passwords to 72 bytes (bcrypt’s limit)', () => {
    expect(passwordProblem(`A1.${'x'.repeat(70)}`)).toBe('Use at most 72 characters.')
  })
})

describe('validatePasswordChange', () => {
  it('reports each field’s problem', () => {
    expect(validatePasswordChange({ current: '', next: 'Password1.', confirm: 'Other1.' })).toEqual({
      current_password: 'Enter your current password.',
      confirm: 'New passwords do not match.',
    })
    expect(validatePasswordChange({ current: 'Password1.', next: 'Password1.', confirm: 'Password1.' })).toEqual({
      new_password: 'Choose a password different from your current one.',
    })
  })
})
