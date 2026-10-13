import { MoreHorizontal } from 'lucide-react'
import { Button } from './Button.jsx'
import './ActionMenu.css'

/**
 * "…" button that reveals a menu on hover.
 * items: [{ label, onClick, disabled, title }] (title explains a disabled item).
 */
export function ActionMenu({ items }) {
  return (
    <div className="action-menu">
      <Button variant="secondary" aria-label="More actions">
        <MoreHorizontal size={18} />
      </Button>
      <div className="action-menu-pop">
        {items.map(({ label, onClick, disabled, title }) => (
          <button key={label} onClick={onClick} disabled={disabled} title={title}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
