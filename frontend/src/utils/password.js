// Password rules shared by every form that sets a password. They match the backend
// (Validator.password): 8 to 72 characters, with at least one letter and one number.

export const PASSWORD_HINT = '8–72 characters, with at least one letter and one number.'

/** The first rule a new password breaks, as a message, or null if it's fine. */
export function passwordProblem(password) {
  if (password.length < 8) return 'Use at least 8 characters.'
  if (new TextEncoder().encode(password).length > 72) return 'Use at most 72 characters.'
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.'
  return null
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
