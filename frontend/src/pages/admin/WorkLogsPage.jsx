import { useState } from 'react'
import { Clock3, Plus } from 'lucide-react'
import { Button, PageHeading, Panel, QueryContent, SearchBox } from '../../components/ui'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'
import { WorkLogFilters } from '../../components/worklogs/WorkLogFilters.jsx'
import { WorkLogTable } from '../../components/worklogs/WorkLogTable.jsx'
import { useApiQuery } from '../../hooks/useApiQuery.js'
import { useFilters } from '../../hooks/useFilters.js'
import { listProjects } from '../../services/projectsApi.js'
import { listUsers } from '../../services/usersApi.js'
import { listWorkLogs } from '../../services/workLogsApi.js'
import { includesText } from '../../utils/text.js'
import { ROLE } from '../../utils/users.js'
import { getAdminWorkLogColumns } from './adminWorkLogColumns.jsx'

/** Every workday across all projects, filtered by the API, with historical entry and correction. */
export function WorkLogsPage({ onOpenDialog }) {
  const [search, setSearch] = useState('')
  const { filters, setFilter } = useFilters({ from: '', to: '', employee_id: '', project_id: '' })
  const logs = useApiQuery(() => listWorkLogs(filters), [filters])
  const employees = useApiQuery(() => listUsers({ role: ROLE.employee, include_archived: 'true' }), [])
  const projects = useApiQuery(() => listProjects(), [])

  return (
    <>
      <PageHeading
        eyebrow="Time & cost"
        title="Work logs"
        description="Review employee workdays across active, closed, and archived projects."
        actions={
          <Button onClick={() => onOpenDialog(DIALOGS.addWorkLog)}>
            <Plus size={16} />
            Add historical workday
          </Button>
        }
      />
      <Panel>
        <div className="toolbar toolbar-wrap">
          <SearchBox value={search} onChange={setSearch} placeholder="Search employee, project, or milestone" />
          <WorkLogFilters
            filters={filters}
            setFilter={setFilter}
            selects={[
              { name: 'employee_id', label: 'Employee', allLabel: 'All employees', options: employees.data ?? [] },
              { name: 'project_id', label: 'Project', allLabel: 'All projects', options: projects.data ?? [] },
            ]}
          />
        </div>
        <div className="info-strip in-panel">
          <Clock3 size={16} />
          Work date is distinct from the date an entry was created or corrected.
          Historical rates stay unchanged after salary updates.
        </div>
        <QueryContent query={logs} loadingLabel="Loading work logs…">
          {(rows) => (
            <WorkLogTable
              key={`${search}|${JSON.stringify(filters)}`}
              logs={rows.filter((log) =>
                includesText(`${log.employee.name} ${log.project.name} ${log.milestone.name}`, search),
              )}
              columns={getAdminWorkLogColumns(onOpenDialog)}
            />
          )}
        </QueryContent>
      </Panel>
    </>
  )
}
