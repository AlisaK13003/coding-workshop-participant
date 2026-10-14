// Sign-in, sign-up and the current user. Backed by the auth service (/api/auth).
import { api, request } from './apiClient.js'
import { clearSession, saveSession } from './session.js'

/** Signs in and remembers the session. Returns the user. */
export async function login(username, password) {
  const result = await request('auth', '/login', { method: 'POST', body: { username, password }, auth: false })
  saveSession(result)
  return result.user
}

export function logout() {
  clearSession()
}

/** { signup_open } — sign-up only works before any account exists. */
export function getSetupStatus() {
  return request('auth', '/setup', { auth: false })
}

/** Creates the first admin and signs them in. Returns the user. */
export async function signup(details) {
  const result = await request('auth', '/signup', { method: 'POST', body: details, auth: false })
  saveSession(result)
  return result.user
}

export const getCurrentUser = () => api.get('auth', '/me')

export const changePassword = (currentPassword, newPassword) =>
  api.put('auth', '/me/password', { current_password: currentPassword, new_password: newPassword })

/** Where each role lands after signing in. */
export const HOME_BY_ROLE = {
  admin: '/admin',
  manager: '/manager',
  employee: '/employee',
}
