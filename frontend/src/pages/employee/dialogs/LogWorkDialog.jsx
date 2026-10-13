import { Clock3 } from 'lucide-react'
import { ModalActions } from '../../../components/dialogs'
import { Button, Modal } from '../../../components/ui'
import { TODAY_KEY } from '../../../data/employeeData.js'
import { formatDate } from '../../../utils/format.js'
import './LogWorkDialog.css'

/** Confirms today's 8-hour entry on the project's current milestone. */
export function LogWorkDialog({ project, milestone, onClose, onConfirm }) {
  return (
    <Modal
      title="Log today’s work?"
      description="Work entries cannot be edited or deleted by employees."
      onClose={onClose}
    >
      <div className="log-confirmation">
        <span>
          <Clock3 size={23} />
        </span>
        <p>
          <strong>
            Log 8 hours for today on {project.name} → {milestone.name}?
          </strong>
          <small>
            You can log only one project per day. Contact an admin if this entry
            needs correcting.
          </small>
        </p>
      </div>
      <dl className="confirmation-summary">
        <div>
          <dt>Work date</dt>
          <dd>{formatDate(TODAY_KEY)}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>8 hours</dd>
        </div>
      </dl>
      <ModalActions onCancel={onClose}>
        <Button onClick={onConfirm}>Log today’s work</Button>
      </ModalActions>
    </Modal>
  )
}
