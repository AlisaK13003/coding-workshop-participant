import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from './Button.jsx'
import './ActionMenu.css'

/**
 * "…" button that opens a menu on click; closes on choosing an item, Escape or clicking elsewhere.
 * items: [{ label, onClick, disabled, title }] (title explains a disabled item).
 * Falsy items are skipped, so callers can write `canArchive && { … }`; with none left it renders nothing.
 */
export function ActionMenu({ items }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const closeOutside = (event) => !wrap.current?.contains(event.target) && setOpen(false)
    document.addEventListener('mousedown', closeOutside)
    return () => document.removeEventListener('mousedown', closeOutside)
  }, [open])

  const visible = items.filter(Boolean)
  if (!visible.length) return null
  return (
    <div ref={wrap} className="action-menu" onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}>
      <Button
        variant="secondary"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={18} />
      </Button>
      {open && (
        <div className="action-menu-pop" role="menu">
          {visible.map(({ label, onClick, disabled, title }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              disabled={disabled}
              title={title}
              onClick={() => {
                setOpen(false)
                onClick()
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
