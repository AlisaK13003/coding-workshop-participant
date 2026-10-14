// Keeps the signed-in user and their tokens, and tells listeners when they change.
// Stored in localStorage so a page refresh keeps you signed in.

const STORAGE_KEY = 'project-tracker.session'
const listeners = new Set()

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? null
  } catch {
    return null
  }
}

let current = read()

/** { user, accessToken, refreshToken } or null when signed out. */
export function getSession() {
  return current
}

/** Saves the response of /auth/login, /auth/signup or /auth/refresh. */
export function saveSession({ user, access_token, refresh_token }) {
  current = {
    user: user ?? current?.user,
    accessToken: access_token,
    refreshToken: refresh_token,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  listeners.forEach((listener) => listener(current))
}

export function clearSession() {
  current = null
  localStorage.removeItem(STORAGE_KEY)
  listeners.forEach((listener) => listener(null))
}

/** Calls listener(session) on every change; returns an unsubscribe function. */
export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
