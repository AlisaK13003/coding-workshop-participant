// Password rules shared by every form that sets a password. They match the backend
// (Validator.password): 8 to 72 characters, with an uppercase letter, a number and a
// special character (anything that isn't a letter, number or space, e.g. . ! @ -).
import { listWords } from './text.js'

export const PASSWORD_HINT =
  '8–72 characters, with an uppercase letter, a number and a special character like . or !'

/** The problem with a new password, as a message (same wording as the server), or null if it's fine. */
export function passwordProblem(password) {
  if (password.length < 8) return 'Use at least 8 characters.'
  if (new TextEncoder().encode(password).length > 72) return 'Use at most 72 characters.'
  const missing = [
    !/\p{Lu}/u.test(password) && 'an uppercase letter',
    !/\d/.test(password) && 'a number',
    !/[^\p{L}\p{N}\s]/u.test(password) && 'a special character like . or !',
  ].filter(Boolean)
  return missing.length ? `Include ${listWords(missing)}.` : null
}

/** Returns { field: message } for each problem; empty when the change can be sent. The server checks the current password. */
export function validatePasswordChange({ current, next, confirm }) {
  const errors = {}
  if (!current) errors.current_password = 'Enter your current password.'
  const problem = passwordProblem(next)
  if (problem) errors.new_password = problem
  else if (next === current) errors.new_password = 'Choose a password different from your current one.'
  if (next !== confirm) errors.confirm = 'New passwords do not match.'
  return errors
}
