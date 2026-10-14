// Password-change rules shared by any "change password" form. They match the
// backend: 8 to 72 characters. The server checks the current password.

/** Returns { field: message } for each problem; empty when the change can be sent. */
export function validatePasswordChange({ current, next, confirm }) {
  const errors = {}
  if (!current) errors.current_password = 'Enter your current password.'
  if (next.length < 8) errors.new_password = 'Use at least 8 characters.'
  else if (new TextEncoder().encode(next).length > 72) errors.new_password = 'Use at most 72 characters.'
  else if (next === current) errors.new_password = 'Choose a password different from your current one.'
  if (next !== confirm) errors.confirm = 'New passwords do not match.'
  return errors
}
