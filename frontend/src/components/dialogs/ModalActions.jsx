import { Button } from '../ui'
import './dialogs.css'

/** Footer row of a dialog: optional leading buttons, Cancel, then the main action(s) as children. */
export function ModalActions({ onCancel, leading, children }) {
  return (
    <div className="modal-actions">
      {leading}
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      {children}
    </div>
  )
}
