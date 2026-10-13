import { WorkLogTable } from '../../components/worklogs/WorkLogTable.jsx'
import { Button } from '../../components/ui'

const COLUMNS = [
  'date',
  'employee',
  'project',
  'milestone',
  'hours',
  'rate',
  'cost',
  'corrected',
  {
    key: 'actions',
    header: '',
    render: () => <Button variant="ghost">Correct</Button>,
  },
]

/** Admin flavour of the shared work log table: rates, corrections and a Correct action. */
export function AdminWorkLogTable({ logs }) {
  const rows = logs.map((log, index) => ({
    ...log,
    note: `Created Jun ${index + 13}, 2025`,
  }))
  return (
    <WorkLogTable
      logs={rows}
      columns={COLUMNS}
      getRowKey={(log, index) => `${log.employee}-${log.date}-${index}`}
    />
  )
}
