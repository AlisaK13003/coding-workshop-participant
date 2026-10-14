import { createContext, useContext } from 'react'

/** Filled in by ToastProvider (components/ui/ToastProvider.jsx), which wraps the app. */
export const ToastContext = createContext({ showToast: () => {} })

/** { showToast(text, tone = 'success' | 'error') } for the one toast shared by the whole app. */
export function useToast() {
  return useContext(ToastContext)
}
