import { WorkLogTable } from '../../components/worklogs/WorkLogTable.jsx'
import { toWorkLogRows } from '../../utils/workLogs.js'

const COLUMNS = ['date', 'project', 'milestone', 'hours']

/** Read-only employee flavour of the shared work log table. */
export function EmployeeWorkLogTable({
  logs,
  projects,
  milestones,
  showSubmitted = false,
}) {
  const rows = toWorkLogRows(logs, { projects, milestones }).map((row) => ({
    ...row,
    note: row.historical ? 'Historical admin entry' : undefined,
  }))
  return (
    <WorkLogTable
      logs={rows}
      columns={showSubmitted ? [...COLUMNS, 'submitted'] : COLUMNS}
    />
  )
}
