import { useCallback, useState } from 'react'

const CLOSED = { kind: null, payload: null }

/**
 * Which dialog is open, plus optional data for it.
 * open('archive', project) → { kind: 'archive', payload: project }.
 */
export function useModal() {
  const [modal, setModal] = useState(CLOSED)
  const open = useCallback(
    (kind, payload = null) => setModal({ kind, payload }),
    [],
  )
  const close = useCallback(() => setModal(CLOSED), [])
  return { kind: modal.kind, payload: modal.payload, open, close }
}
