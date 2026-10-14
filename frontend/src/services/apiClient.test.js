import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { json, mockFetch } from '../test/fetchMock.js'
import { api } from './apiClient.js'
import { clearSession, getSession, saveSession } from './session.js'

const USER = { id: 4, role: 'admin', first_name: 'Priya' }
// A fresh response each time: a body can only be read once.
const expired = () => json(401, { error: { code: 'token_expired', message: 'Your session expired.' } })

beforeEach(() => saveSession({ user: USER, access_token: 'old-access', refresh_token: 'refresh-1' }))
afterEach(() => {
  clearSession()
  vi.unstubAllGlobals()
})

describe('api client', () => {
  it('sends the access token and drops empty query parameters', async () => {
    const calls = mockFetch([{ path: '/api/projects/', respond: () => json(200, [{ id: 1 }]) }])
    await expect(api.get('projects', '/', { status: 'in_progress', archived: '' })).resolves.toEqual([{ id: 1 }])
    expect(calls[0].headers.Authorization).toBe('Bearer old-access')
    expect(fetch.mock.calls[0][0]).toMatch(/\/api\/projects\/\?status=in_progress$/)
  })

  it('refreshes an expired token once and retries the request', async () => {
    const calls = mockFetch([
      { path: '/api/users/', respond: expired },
      { method: 'POST', path: '/api/auth/refresh', respond: () => json(200, { access_token: 'new-access', refresh_token: 'refresh-2' }) },
      { path: '/api/users/', respond: () => json(200, []) },
    ])
    await expect(api.get('users', '/')).resolves.toEqual([])
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /api/users/',
      'POST /api/auth/refresh',
      'GET /api/users/',
    ])
    expect(calls[1].body).toEqual({ refresh_token: 'refresh-1' })
    expect(calls[2].headers.Authorization).toBe('Bearer new-access')
    expect(getSession()).toMatchObject({ user: USER, accessToken: 'new-access', refreshToken: 'refresh-2' })
  })

  it('shares one refresh between requests that expire together', async () => {
    const calls = mockFetch([
      { path: '/api/users/', respond: expired },
      { path: '/api/projects/', respond: expired },
      { method: 'POST', path: '/api/auth/refresh', respond: () => json(200, { access_token: 'new', refresh_token: 'r2' }) },
      { path: '/api/users/', respond: () => json(200, []) },
      { path: '/api/projects/', respond: () => json(200, []) },
    ])
    await Promise.all([api.get('users', '/'), api.get('projects', '/')])
    expect(calls.filter((call) => call.path === '/api/auth/refresh')).toHaveLength(1)
  })

  it('signs out when the refresh token is no longer valid', async () => {
    mockFetch([
      { path: '/api/users/', respond: expired },
      { method: 'POST', path: '/api/auth/refresh', respond: () => json(401, { error: { code: 'invalid_token', message: 'Sign in again.' } }) },
    ])
    await expect(api.get('users', '/')).rejects.toMatchObject({ status: 401, message: 'Sign in again.' })
    expect(getSession()).toBeNull()
  })

  it('turns API errors into ApiError with the field messages', async () => {
    mockFetch([
      {
        method: 'POST',
        path: '/api/projects/',
        respond: () => json(400, { error: { code: 'validation_error', message: 'Check the form.', fields: { name: 'Required.' } } }),
      },
    ])
    await expect(api.post('projects', '/', {})).rejects.toMatchObject({
      status: 400,
      code: 'validation_error',
      fields: { name: 'Required.' },
    })
  })

  it('explains network failures and treats an HTML page as not found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')))
    await expect(api.get('users', '/')).rejects.toMatchObject({ code: 'network_error' })
    mockFetch([{ path: '/api/nope', respond: () => new Response('<!doctype html>', { status: 200 }) }])
    await expect(api.get('nope')).rejects.toMatchObject({ status: 404 })
  })

  it('returns null for 204 responses', async () => {
    mockFetch([{ method: 'DELETE', path: '/api/projects/1', respond: () => json(204) }])
    await expect(api.delete('projects', '/1')).resolves.toBeNull()
  })
})
