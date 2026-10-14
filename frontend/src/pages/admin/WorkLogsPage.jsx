import { useState } from 'react'
import { Clock3, Plus } from 'lucide-react'
import {
  Button,
  Input,
  PageHeading,
  Panel,
  QueryContent,
  SearchBox,
  Select,
} from '../../components/ui'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'
import { WorkLogTable } from '../../components/worklogs/WorkLogTable.jsx'
import { useApiQuery } from '../../hooks/useApiQuery.js'
import { listProjects } from '../../services/projectsApi.js'
import { listUsers } from '../../services/usersApi.js'
import { listWorkLogs } from '../../services/workLogsApi.js'
import { includesText } from '../../utils/text.js'
import { getAdminWorkLogColumns } from './adminWorkLogColumns.jsx'

/** Every workday across all projects, filtered by the API, with historical entry and correction. */
export function WorkLogsPage({ onOpenDialog }) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ from: '', to: '', employee_id: '', project_id: '' })
  const logs = useApiQuery(() => listWorkLogs(filters), [filters])
  const employees = useApiQuery(() => listUsers({ role: 'employee', include_archived: 'true' }), [])
  const projects = useApiQuery(() => listProjects(), [])
  const setFilter = (name) => (value) => setFilters((current) => ({ ...current, [name]: value }))

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
          <div className="filters">
            <Input
              type="date"
              value={filters.from}
              onChange={(event) => setFilter('from')(event.target.value)}
              aria-label="From date"
            />
            <Input
              type="date"
              value={filters.to}
              onChange={(event) => setFilter('to')(event.target.value)}
              aria-label="To date"
            />
            <Select value={filters.employee_id} onChange={setFilter('employee_id')} aria-label="Employee">
              <option value="">All employees</option>
              {(employees.data ?? []).map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </Select>
            <Select value={filters.project_id} onChange={setFilter('project_id')} aria-label="Project">
              <option value="">All projects</option>
              {(projects.data ?? []).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="info-strip">
          <Clock3 size={16} />
          Work date is distinct from the date an entry was created or corrected.
          Historical rates stay unchanged after salary updates.
        </div>
        <QueryContent query={logs} loadingLabel="Loading work logs…">
          {(rows) => (
            <WorkLogTable
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
