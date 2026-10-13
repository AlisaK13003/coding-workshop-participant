import { X } from 'lucide-react'
import { cx } from '../../utils/cx.js'
import { Button } from './Button.jsx'
import './Modal.css'

/** Dialog with a backdrop. Clicking the backdrop or the X calls onClose. */
export function Modal({ title, description, children, onClose, wide = false }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className={cx('modal', wide && 'modal-wide')}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header>
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close dialog">
            <X size={19} />
          </Button>
        </header>
        {children}
      </section>
    </div>
  )
}
