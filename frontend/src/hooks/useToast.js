import { useCallback, useEffect, useRef, useState } from 'react'

/** A single toast message that hides itself after `duration` milliseconds. */
export function useToast(duration = 3500) {
  const [message, setMessage] = useState('')
  const timer = useRef(null)

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current)
    setMessage('')
  }, [])

  const showToast = useCallback(
    (text) => {
      window.clearTimeout(timer.current)
      setMessage(text)
      timer.current = window.setTimeout(() => setMessage(''), duration)
    },
    [duration],
  )

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { message, showToast, dismiss }
}
