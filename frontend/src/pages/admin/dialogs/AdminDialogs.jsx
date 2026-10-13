import { ADMIN_DIALOGS } from '../adminConfig.js'
import { AddMilestoneDialog } from './AddMilestoneDialog.jsx'
import { AddWorkLogDialog } from './AddWorkLogDialog.jsx'
import { ArchiveProjectDialog } from './ArchiveProjectDialog.jsx'
import { CompleteMilestoneDialog } from './CompleteMilestoneDialog.jsx'
import { CreateProjectDialog } from './CreateProjectDialog.jsx'
import { CreateUserDialog } from './CreateUserDialog.jsx'
import { TransferEmployeeDialog } from './TransferEmployeeDialog.jsx'
import { UnarchiveProjectDialog } from './UnarchiveProjectDialog.jsx'

// Every admin dialog takes the same props: { payload, onClose, onSubmit }.
const DIALOGS = {
  [ADMIN_DIALOGS.createProject]: CreateProjectDialog,
  [ADMIN_DIALOGS.createUser]: CreateUserDialog,
  [ADMIN_DIALOGS.addMilestone]: AddMilestoneDialog,
  [ADMIN_DIALOGS.addWorkLog]: AddWorkLogDialog,
  [ADMIN_DIALOGS.completeMilestone]: CompleteMilestoneDialog,
  [ADMIN_DIALOGS.archiveProject]: ArchiveProjectDialog,
  [ADMIN_DIALOGS.unarchiveProject]: UnarchiveProjectDialog,
  [ADMIN_DIALOGS.transferEmployee]: TransferEmployeeDialog,
}

/** Renders whichever admin dialog is open (kind from useModal), or nothing. */
export function AdminDialogs({ kind, payload, onClose, onSubmit }) {
  const Dialog = DIALOGS[kind]
  if (!Dialog) return null
  return <Dialog payload={payload} onClose={onClose} onSubmit={onSubmit} />
}
