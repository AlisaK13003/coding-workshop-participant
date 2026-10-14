import { Button } from '../../components/ui'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'

/** Admin work log columns: pay details plus a Correct action that opens CorrectWorkLogDialog. */
export function getAdminWorkLogColumns(onOpenDialog, { withProject = true } = {}) {
  return [
    'date',
    'employee',
    withProject && 'project',
    'milestone',
    'hours',
    'rate',
    'cost',
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button variant="ghost" onClick={() => onOpenDialog(DIALOGS.correctWorkLog, { log: row.log })}>
          Correct
        </Button>
      ),
    },
  ].filter(Boolean)
}
