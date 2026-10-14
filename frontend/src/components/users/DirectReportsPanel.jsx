import { Badge, EmptyState, Panel, QueryContent } from '../ui'
import { useApiQuery } from '../../hooks/useApiQuery.js'
import { listUsers } from '../../services/usersApi.js'
import { pluralize } from '../../utils/text.js'
import { UserTable } from './UserTable.jsx'

const COLUMNS = ['name', 'username', 'title', 'id', 'open']

/** Admin: the employees who report to `manager`; selecting one calls onOpenUser(user). */
export function DirectReportsPanel({ manager, onOpenUser }) {
  const reports = useApiQuery(() => listUsers({ manager_id: manager.id }), [manager.id])
  const count = reports.data?.length
  return (
    <Panel
      title="Direct reports"
      description={`Employees who report to ${manager.first_name}. Select someone to see their details.`}
      actions={count !== undefined && <Badge>{count} {pluralize(count, 'employee')}</Badge>}
    >
      <QueryContent query={reports} loadingLabel="Loading direct reports…">
        {(users) =>
          users.length ? (
            <UserTable users={users} onOpen={onOpenUser} columns={COLUMNS} />
          ) : (
            <EmptyState title="No direct reports" body="Transfer an employee to this manager to add one." />
          )
        }
      </QueryContent>
    </Panel>
  )
}
