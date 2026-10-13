// TEMPORARY demo sign-in, used until the backend login endpoint exists.
// It checks nothing: any non-empty password is accepted for a known demo
// username. Replace demoSignIn with a real API call and delete this file.

export const DEMO_ACCOUNTS = [
  { username: 'aadmin1', path: '/admin' },
  { username: 'mmanager2', path: '/manager' },
  { username: 'eemployee3', path: '/employee' },
]

export const DEMO_USERNAMES = DEMO_ACCOUNTS.map((account) => account.username)

/**
 * Returns the workspace path for a demo username (case-insensitive), or null
 * when the username is unknown or the password is empty.
 */
export function demoSignIn(username, password) {
  if (!password) return null
  const normalized = username.trim().toLowerCase()
  const account = DEMO_ACCOUNTS.find((item) => item.username === normalized)
  return account ? account.path : null
}
