import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ToastContext } from '../../hooks/useToast.js'
import { Toast } from './Toast.jsx'

/** Owns the app's single toast. A message hides itself after `duration` milliseconds. */
export function ToastProvider({ duration = 3500, children }) {
  const [toast, setToast] = useState({ message: '', tone: 'success' })
  const timer = useRef(null)

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current)
    setToast((current) => ({ ...current, message: '' }))
  }, [])

  const showToast = useCallback(
    (message, tone = 'success') => {
      window.clearTimeout(timer.current)
      setToast({ message, tone })
      timer.current = window.setTimeout(dismiss, duration)
    },
    [dismiss, duration],
  )

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast message={toast.message} tone={toast.tone} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
