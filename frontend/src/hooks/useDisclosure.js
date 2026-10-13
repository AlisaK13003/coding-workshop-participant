import { useCallback, useState } from 'react'

/** Open/closed state for menus, popovers and drawers. */
export function useDisclosure(initiallyOpen = false) {
  const [isOpen, setIsOpen] = useState(initiallyOpen)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((value) => !value), [])
  return { isOpen, open, close, toggle }
}
