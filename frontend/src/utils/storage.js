// localStorage helpers. The prototype uses them to share demo state between
// role workspaces in the same browser; the backend replaces this later.

export function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode, quota). Demo data is optional.
  }
}
