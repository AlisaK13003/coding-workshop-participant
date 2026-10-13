import { WorkLogTable } from '../../components/worklogs/WorkLogTable.jsx'
import { toWorkLogRows } from '../../utils/workLogs.js'

const COLUMNS = ['date', 'employee', 'project', 'milestone', 'hours', 'laborCost']

/** Read-only manager flavour of the shared work log table. */
export function ManagerWorkLogTable({ logs, employees, projects, milestones }) {
  return (
    <WorkLogTable
      logs={toWorkLogRows(logs, { employees, projects, milestones })}
      columns={COLUMNS}
    />
  )
}
