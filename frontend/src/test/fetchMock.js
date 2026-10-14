// A stand-in for fetch in tests: answers requests from a list of routes and records them.
import { vi } from 'vitest'

/** A JSON response like the API sends (null body for 204). */
export const json = (status, body) => new Response(body === undefined ? null : JSON.stringify(body), { status })

/**
 * Replaces fetch. routes: [{ method?, path, respond(request) }] matched in order by
 * method and URL path (each route answers once unless `repeat` is set).
 * Returns the recorded requests: [{ method, path, headers, body }].
 */
export function mockFetch(routes) {
  const calls = []
  const remaining = [...routes]
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      const path = new URL(url, 'http://localhost').pathname
      const method = options.method ?? 'GET'
      const call = { method, path, headers: options.headers ?? {}, body: options.body && JSON.parse(options.body) }
      calls.push(call)
      const index = remaining.findIndex((route) => (route.method ?? 'GET') === method && route.path === path)
      if (index === -1) throw new Error(`Unexpected request: ${method} ${path}`)
      const route = remaining[index]
      if (!route.repeat) remaining.splice(index, 1)
      return route.respond(call)
    }),
  )
  return calls
}
