import { Clock3 } from 'lucide-react'
import { ModalActions, ValidationNote } from '../../dialogs'
import { Button, Modal } from '../../ui'
import { useMutation } from '../../../hooks/useMutation.js'
import { logToday } from '../../../services/workLogsApi.js'
import { todayIso } from '../../../utils/calendar.js'
import { formatDate } from '../../../utils/format.js'
import './LogWorkDialog.css'

/** Employee: confirms today's 8-hour entry on the project's current milestone. */
export function LogWorkDialog({ project, milestone, onClose }) {
  const log = useMutation(() => logToday(project.id, milestone.id), {
    success: 'Today’s 8-hour work entry was submitted.',
    onSuccess: onClose,
  })
  return (
    <Modal
      title="Log today’s work?"
      description="Work entries can’t be edited or deleted by employees."
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
          <dd>{formatDate(todayIso())}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>8 hours</dd>
        </div>
      </dl>
      {log.error && <ValidationNote tone="danger">{log.error}</ValidationNote>}
      <ModalActions onCancel={onClose}>
        <Button onClick={() => log.run()} disabled={log.submitting}>
          {log.submitting ? 'Saving…' : 'Log today’s work'}
        </Button>
      </ModalActions>
    </Modal>
  )
}
