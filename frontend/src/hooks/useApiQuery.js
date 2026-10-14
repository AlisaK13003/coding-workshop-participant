import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

// Every mounted query listens to one shared version number. refreshQueries() bumps it
// after a change is saved, so everything on screen reloads and nothing stays stale.
let version = 0
const listeners = new Set()

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getVersion = () => version

/** Reloads every query on screen. useMutation calls it after each successful change. */
export function refreshQueries() {
  version += 1
  listeners.forEach((listener) => listener())
}

/**
 * Loads data with fetcher() and reloads it when deps change, on reload(), or after
 * refreshQueries(). Returns { data, error, loading, reload }.
 * A response that arrives after deps changed is ignored, so a slow request never
 * overwrites newer data. While reloading the same deps, the previous data stays visible.
 */
export function useApiQuery(fetcher, deps = []) {
  const depsKey = JSON.stringify(deps)
  const globalVersion = useSyncExternalStore(subscribe, getVersion)
  const [reloads, setReloads] = useState(0)
  const [result, setResult] = useState({ requestKey: null, depsKey: null, data: undefined, error: null })
  const requestKey = `${depsKey}#${globalVersion}#${reloads}`

  // The latest fetcher, so callers can pass an inline function.
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let cancelled = false
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then(
        (data) => !cancelled && setResult({ requestKey, depsKey, data, error: null }),
        (error) => !cancelled && setResult({ requestKey, depsKey, data: undefined, error }),
      )
    return () => {
      cancelled = true
    }
  }, [requestKey, depsKey])

  const reload = useCallback(() => setReloads((count) => count + 1), [])
  const sameDeps = result.depsKey === depsKey

  return {
    data: sameDeps ? result.data : undefined,
    error: sameDeps ? result.error : null,
    loading: result.requestKey !== requestKey,
    reload,
  }
}

/**
 * Combines queries for a screen that needs several: data is the list of their data
 * once all have loaded, error is the first error, reload reloads them all.
 */
export function combineQueries(...queries) {
  const ready = queries.every((query) => query.data !== undefined)
  return {
    data: ready ? queries.map((query) => query.data) : undefined,
    error: queries.find((query) => query.error)?.error ?? null,
    loading: queries.some((query) => query.loading),
    reload: () => queries.forEach((query) => query.reload()),
  }
}
