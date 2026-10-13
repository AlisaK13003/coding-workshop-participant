import { ConfirmDialog, ValidationNote } from '../../../components/dialogs'
import { Field, Select } from '../../../components/ui'

/** Manager transfer, blocked until incompatible assignments are resolved. */
export function TransferEmployeeDialog({ onClose, onSubmit }) {
  return (
    <ConfirmDialog
      title="Transfer employee"
      description="Review incompatible assignments before confirming."
      confirmLabel="Resolve assignment to continue"
      confirmDisabled
      onConfirm={onSubmit}
      onClose={onClose}
    >
      <Field label="New manager">
        <Select>
          <option>Noah Williams</option>
          <option>Priya Shah</option>
        </Select>
      </Field>
      <ValidationNote tone="danger">
        <strong>1 assignment needs resolution.</strong> Customer Portal Rebuild
        is managed by Maya Chen. Remove Aisha from this project before
        transferring.
      </ValidationNote>
    </ConfirmDialog>
  )
}
