import { EMPLOYEE_DIALOGS } from '../employeeConfig.js'
import { LogWorkDialog } from './LogWorkDialog.jsx'
import { RequestReviewDialog } from './RequestReviewDialog.jsx'

/** Renders the open employee dialog when its project and milestone exist. */
export function EmployeeDialogs({
  kind,
  project,
  milestone,
  onClose,
  onConfirmLog,
  onRequestReview,
}) {
  if (!project || !milestone) return null
  if (kind === EMPLOYEE_DIALOGS.logWork) {
    return (
      <LogWorkDialog
        project={project}
        milestone={milestone}
        onClose={onClose}
        onConfirm={onConfirmLog}
      />
    )
  }
  if (kind === EMPLOYEE_DIALOGS.requestReview) {
    return (
      <RequestReviewDialog
        project={project}
        milestone={milestone}
        onClose={onClose}
        onSubmit={onRequestReview}
      />
    )
  }
  return null
}
