// Password-change rules shared by any "change password" form.

/** Returns the first problem as a message, or '' when the change is valid. */
export function validatePasswordChange({ current, next, confirm }) {
  if (!current) return 'Enter your current password.'
  if (next.length < 10) return 'New password must be at least 10 characters.'
  if (!/[A-Z]/.test(next) || !/[0-9]/.test(next)) {
    return 'Include at least one uppercase letter and one number.'
  }
  if (next !== confirm) return 'New passwords do not match.'
  if (next === current) {
    return 'Choose a password different from your current password.'
  }
  return ''
}
