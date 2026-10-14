import { Archive, ArchiveRestore } from 'lucide-react'
import { ConfirmDialog } from '../../dialogs'
import { useMutation } from '../../../hooks/useMutation.js'
import { archiveUser, restoreUser } from '../../../services/usersApi.js'

/** Admin: archive `user`, or restore them when already archived. Nobody is ever deleted. */
export function ArchiveUserDialog({ user, onClose }) {
  const restoring = Boolean(user.archived_at)
  const change = useMutation(() => (restoring ? restoreUser(user.id) : archiveUser(user.id)), {
    success: restoring ? `${user.name} was restored.` : `${user.name} was archived.`,
    onSuccess: onClose,
  })
  return (
    <ConfirmDialog
      title={restoring ? `Restore ${user.name}?` : `Archive ${user.name}?`}
      description="Archived users can’t sign in. Their history is kept."
      icon={restoring ? ArchiveRestore : Archive}
      heading={restoring ? 'Let this user sign in again?' : 'Stop this user from signing in?'}
      message={
        restoring
          ? 'Their previous project memberships aren’t restored; add them to projects again if needed.'
          : 'Employees are taken off their projects. Managers must hand over their employees and open projects first.'
      }
      confirmLabel={restoring ? 'Restore user' : 'Archive user'}
      confirmVariant={restoring ? 'primary' : 'danger'}
      onConfirm={() => change.run()}
      submitting={change.submitting}
      error={change.error}
      onClose={onClose}
    />
  )
}
