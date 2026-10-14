// The one place that talks to the backend. Adds the sign-in token to every request,
// refreshes it when it expires, and turns failures into ApiError with a readable message.
// Screens never call fetch directly; they use the per-area modules (projectsApi.js, …).
import { clearSession, getSession, saveSession } from './session.js'

// Locally this is the proxy (http://localhost:3001); deployed, the API shares the site's origin.
const API_URL = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  /** fields: { fieldName: message } for validation errors, so forms can show them per field. */
  constructor(status, code, message, fields = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

function buildUrl(service, path, query) {
  const url = `${API_URL}/api/${service}${path}`
  const params = new URLSearchParams()
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value)
  })
  const search = params.toString()
  return search ? `${url}?${search}` : url
}

async function send(service, path, { method = 'GET', body, query, token }) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(buildUrl(service, path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'network_error', "Can't reach the server. Check your connection and try again.")
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    const error = data?.error ?? {}
    throw new ApiError(response.status, error.code ?? 'error', error.message ?? 'Something went wrong.', error.fields)
  }
  return data
}

// Several requests can expire at once; they all wait for the same refresh.
let refreshing = null

function refreshTokens() {
  const refreshToken = getSession()?.refreshToken
  if (!refreshToken) return Promise.reject(new ApiError(401, 'missing_token', 'Sign in to continue.'))
  refreshing ??= send('auth', '/refresh', { method: 'POST', body: { refresh_token: refreshToken } })
    .then(saveSession)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

/**
 * Calls /api/<service><path>. Options: { method, body, query, auth = true }.
 * Returns the parsed JSON (or null for 204). Throws ApiError.
 */
export async function request(service, path = '', { auth = true, ...options } = {}) {
  if (!auth) return send(service, path, options)
  try {
    return await send(service, path, { ...options, token: getSession()?.accessToken })
  } catch (error) {
    if (error.status !== 401 || error.code !== 'token_expired') throw error
  }
  try {
    await refreshTokens()
  } catch (error) {
    clearSession()
    throw error
  }
  return send(service, path, { ...options, token: getSession()?.accessToken })
}

/** Small helpers so API modules read like the REST routes they call. */
export const api = {
  get: (service, path, query) => request(service, path, { query }),
  post: (service, path, body) => request(service, path, { method: 'POST', body: body ?? {} }),
  put: (service, path, body) => request(service, path, { method: 'PUT', body }),
  delete: (service, path) => request(service, path, { method: 'DELETE' }),
}
