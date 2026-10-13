import { MANAGER_DIALOGS } from '../managerConfig.js'
import { AddEmployeeDialog } from './AddEmployeeDialog.jsx'
import { CloseProjectDialog } from './CloseProjectDialog.jsx'
import { CompleteMilestoneDialog } from './CompleteMilestoneDialog.jsx'
import { EditEmployeeDialog } from './EditEmployeeDialog.jsx'
import { EditProjectDialog } from './EditProjectDialog.jsx'
import { KeepOpenDialog } from './KeepOpenDialog.jsx'
import { MilestoneFormDialog } from './MilestoneFormDialog.jsx'
import { RemoveEmployeeDialog } from './RemoveEmployeeDialog.jsx'
import { ResetPasswordDialog } from './ResetPasswordDialog.jsx'

/**
 * Renders the open manager dialog, or nothing when its context is missing.
 * project: the open project; milestone / employee: the dialog's subject.
 * actions: callbacks from ManagerApp, named after what each dialog confirms.
 */
export function ManagerDialogs({
  kind,
  project,
  milestone,
  employee,
  milestones,
  employees,
  actions,
  onClose,
}) {
  switch (kind) {
    case MANAGER_DIALOGS.editProject:
      return (
        project && (
          <EditProjectDialog
            project={project}
            onClose={onClose}
            onSave={actions.saveProject}
          />
        )
      )
    case MANAGER_DIALOGS.addMilestone:
    case MANAGER_DIALOGS.editMilestone:
      return (
        project && (
          <MilestoneFormDialog
            project={project}
            milestone={kind === MANAGER_DIALOGS.editMilestone ? milestone : null}
            milestones={milestones}
            onClose={onClose}
            onSave={actions.saveMilestone}
          />
        )
      )
    case MANAGER_DIALOGS.review:
    case MANAGER_DIALOGS.completeMilestone:
      return (
        milestone && (
          <CompleteMilestoneDialog
            milestone={milestone}
            milestones={milestones}
            employees={employees}
            onClose={onClose}
            onComplete={(destinationId) =>
              actions.completeMilestone(milestone.id, destinationId)
            }
            onKeepOpen={
              kind === MANAGER_DIALOGS.review
                ? () => actions.requestKeepOpen(milestone.id)
                : undefined
            }
          />
        )
      )
    case MANAGER_DIALOGS.keepOpen:
      return (
        milestone && (
          <KeepOpenDialog
            onClose={onClose}
            onConfirm={() => actions.keepOpen(milestone.id)}
          />
        )
      )
    case MANAGER_DIALOGS.assignEmployee:
      return (
        project && (
          <AddEmployeeDialog
            project={project}
            employees={employees}
            onClose={onClose}
            onAdd={actions.addEmployee}
          />
        )
      )
    case MANAGER_DIALOGS.removeEmployee:
      return (
        employee && (
          <RemoveEmployeeDialog
            employee={employee}
            onClose={onClose}
            onConfirm={() => actions.removeEmployee(employee.id)}
          />
        )
      )
    case MANAGER_DIALOGS.completeProject:
    case MANAGER_DIALOGS.abandonProject: {
      const status =
        kind === MANAGER_DIALOGS.completeProject ? 'Completed' : 'Abandoned'
      return (
        project && (
          <CloseProjectDialog
            status={status}
            onClose={onClose}
            onConfirm={() => actions.closeProject(status)}
          />
        )
      )
    }
    case MANAGER_DIALOGS.editEmployee:
      return (
        employee && (
          <EditEmployeeDialog
            employee={employee}
            onClose={onClose}
            onSave={actions.saveEmployee}
          />
        )
      )
    case MANAGER_DIALOGS.resetPassword:
      return (
        employee && (
          <ResetPasswordDialog
            employee={employee}
            onClose={onClose}
            onConfirm={() => actions.resetPassword(employee)}
          />
        )
      )
    default:
      return null
  }
}
