import { useEffect, useId, useRef, useState } from 'react'
import './Tooltip.css'

/**
 * Small "?" button that shows `text` (or richer `children`) in a popover. Opens on hover,
 * keyboard focus or click (for touch); closes on leaving, Escape or clicking elsewhere.
 * `label` is what screen readers announce for the button.
 */
export function Tooltip({ text, children, label = 'More information' }) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const wrap = useRef(null)
  const id = useId()
  const shown = open || pinned

  useEffect(() => {
    if (!pinned) return undefined
    const closeOutside = (event) => !wrap.current?.contains(event.target) && setPinned(false)
    document.addEventListener('mousedown', closeOutside)
    return () => document.removeEventListener('mousedown', closeOutside)
  }, [pinned])

  const close = () => {
    setOpen(false)
    setPinned(false)
  }

  return (
    <span
      ref={wrap}
      className="tooltip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(event) => event.key === 'Escape' && close()}
    >
      <button
        type="button"
        className="tooltip"
        aria-label={label}
        aria-expanded={shown}
        aria-describedby={shown ? id : undefined}
        onClick={(event) => {
          event.stopPropagation()
          setPinned((value) => !value)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {shown && (
        <span className="tooltip-popover" role="tooltip" id={id}>
          {children ?? text}
        </span>
      )}
    </span>
  )
}
