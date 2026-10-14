import { CompleteMilestoneDialog } from '../milestones/dialogs/CompleteMilestoneDialog.jsx'
import { DeleteMilestoneDialog } from '../milestones/dialogs/DeleteMilestoneDialog.jsx'
import { KeepOpenDialog } from '../milestones/dialogs/KeepOpenDialog.jsx'
import { MilestoneFormDialog } from '../milestones/dialogs/MilestoneFormDialog.jsx'
import { RequestReviewDialog } from '../milestones/dialogs/RequestReviewDialog.jsx'
import { AddMemberDialog } from '../projects/dialogs/AddMemberDialog.jsx'
import { ArchiveProjectDialog } from '../projects/dialogs/ArchiveProjectDialog.jsx'
import { AssignManagerDialog } from '../projects/dialogs/AssignManagerDialog.jsx'
import { CloseProjectDialog } from '../projects/dialogs/CloseProjectDialog.jsx'
import { ProjectFormDialog } from '../projects/dialogs/ProjectFormDialog.jsx'
import { RemoveMemberDialog } from '../projects/dialogs/RemoveMemberDialog.jsx'
import { UnarchiveProjectDialog } from '../projects/dialogs/UnarchiveProjectDialog.jsx'
import { ArchiveUserDialog } from '../users/dialogs/ArchiveUserDialog.jsx'
import { ResetPasswordDialog } from '../users/dialogs/ResetPasswordDialog.jsx'
import { TransferEmployeeDialog } from '../users/dialogs/TransferEmployeeDialog.jsx'
import { UserFormDialog } from '../users/dialogs/UserFormDialog.jsx'
import { AddWorkLogDialog } from '../worklogs/dialogs/AddWorkLogDialog.jsx'
import { CorrectWorkLogDialog } from '../worklogs/dialogs/CorrectWorkLogDialog.jsx'
import { LogWorkDialog } from '../worklogs/dialogs/LogWorkDialog.jsx'
import { DIALOGS } from './dialogKinds.js'

// Each kind's component, plus fixed props for kinds that share a component.
const REGISTRY = {
  [DIALOGS.createProject]: [ProjectFormDialog],
  [DIALOGS.editProject]: [ProjectFormDialog],
  [DIALOGS.completeProject]: [CloseProjectDialog, { outcome: 'complete' }],
  [DIALOGS.abandonProject]: [CloseProjectDialog, { outcome: 'abandon' }],
  [DIALOGS.archiveProject]: [ArchiveProjectDialog],
  [DIALOGS.unarchiveProject]: [UnarchiveProjectDialog],
  [DIALOGS.assignManager]: [AssignManagerDialog],
  [DIALOGS.addMember]: [AddMemberDialog],
  [DIALOGS.removeMember]: [RemoveMemberDialog],
  [DIALOGS.addMilestone]: [MilestoneFormDialog],
  [DIALOGS.editMilestone]: [MilestoneFormDialog],
  [DIALOGS.deleteMilestone]: [DeleteMilestoneDialog],
  [DIALOGS.completeMilestone]: [CompleteMilestoneDialog],
  [DIALOGS.reviewMilestone]: [CompleteMilestoneDialog, { review: true }],
  [DIALOGS.keepOpen]: [KeepOpenDialog],
  [DIALOGS.requestReview]: [RequestReviewDialog],
  [DIALOGS.createUser]: [UserFormDialog],
  [DIALOGS.editUser]: [UserFormDialog],
  [DIALOGS.transferEmployee]: [TransferEmployeeDialog],
  [DIALOGS.resetPassword]: [ResetPasswordDialog],
  [DIALOGS.archiveUser]: [ArchiveUserDialog],
  [DIALOGS.logWork]: [LogWorkDialog],
  [DIALOGS.addWorkLog]: [AddWorkLogDialog],
  [DIALOGS.correctWorkLog]: [CorrectWorkLogDialog],
}

/**
 * Renders whichever dialog is open. modal comes from useModal(); its payload holds
 * the dialog's subject (project, milestone, member, user or log) and becomes props.
 * Each dialog saves through the API itself and closes when done.
 */
export function WorkspaceDialogs({ modal }) {
  const entry = REGISTRY[modal.kind]
  if (!entry) return null
  const [Dialog, fixedProps] = entry
  return (
    <Dialog
      {...fixedProps}
      {...modal.payload}
      onClose={modal.close}
      onOpenDialog={modal.open}
    />
  )
}
