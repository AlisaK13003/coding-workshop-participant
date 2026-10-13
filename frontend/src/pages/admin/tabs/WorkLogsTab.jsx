import { Plus } from 'lucide-react'
import { Button, Panel } from '../../../components/ui'
import { ADMIN_DIALOGS } from '../adminConfig.js'
import { AdminWorkLogTable } from '../AdminWorkLogTable.jsx'

/** Work logs recorded against the project. */
export function WorkLogsTab({ project, workLogs, onOpenDialog }) {
  // Prototype sample data: the first project shows every log.
  const logs = workLogs.filter(
    (log) => log.project === project.name || project.id === 1,
  )
  return (
    <Panel
      title="Project work logs"
      description="Historical pay rate and cost are preserved on each entry."
      actions={
        <Button onClick={() => onOpenDialog(ADMIN_DIALOGS.addWorkLog)}>
          <Plus size={16} />
          Add historical entry
        </Button>
      }
    >
      <AdminWorkLogTable logs={logs} />
    </Panel>
  )
}
