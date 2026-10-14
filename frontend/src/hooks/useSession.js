import { useSyncExternalStore } from 'react'
import { getSession, subscribe } from '../services/session.js'

/** The current session ({ user, accessToken, refreshToken }) or null; re-renders when it changes. */
export function useSession() {
  return useSyncExternalStore(subscribe, getSession)
}
