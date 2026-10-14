import { useSyncExternalStore } from 'react'
import { getSession, subscribe } from '../services/session.js'

/** The current session ({ user, accessToken, refreshToken }) or null; re-renders when it changes. */
export function useSession() {
  return useSyncExternalStore(subscribe, getSession)
}

/**
 * The signed-in user: { id, display_id, username, first_name, last_name, email,
 * job_title, role, manager_id }. Only for screens behind RequireRole, so never null there.
 */
export function useCurrentUser() {
  return useSession()?.user
}
