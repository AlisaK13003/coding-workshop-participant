import { FormDialog } from '../../dialogs'
import { useMutation } from '../../../hooks/useMutation.js'
import { correctWorkLog } from '../../../services/workLogsApi.js'
import { formatDate } from '../../../utils/format.js'
import { WorkLogFields } from './WorkLogFields.jsx'

/** Admin: correct a log's project, milestone or date. The employee is notified. */
export function CorrectWorkLogDialog({ log, onClose }) {
  const correct = useMutation((changes) => correctWorkLog(log.id, changes), {
    success: 'Work log corrected. The change is in the activity log.',
    onSuccess: onClose,
  })
  const handleSubmit = (data) =>
    correct.run({
      project_id: Number(data.get('project_id')),
      milestone_id: Number(data.get('milestone_id')),
      work_date: data.get('work_date'),
    })

  return (
    <FormDialog
      title="Correct work log"
      description={`${log.employee.name} · ${formatDate(log.work_date)} · recorded rate and hours stay the same.`}
      submitLabel="Save correction"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={correct.submitting}
      error={correct.error}
      wide
    >
      <div className="form-grid">
        <WorkLogFields log={log} errors={correct.fieldErrors} />
      </div>
    </FormDialog>
  )
}
