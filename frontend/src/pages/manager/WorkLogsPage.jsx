import { Clock3 } from 'lucide-react'
import { PageHeading, Panel } from '../../components/ui'
import { WorkLogFilters } from '../../components/worklogs/WorkLogFilters.jsx'
import { WorkLogTable } from '../../components/worklogs/WorkLogTable.jsx'
import { useFilters } from '../../hooks/useFilters.js'
import { uniqueBy } from '../../utils/collections.js'
import { matchesWorkLogFilters } from '../../utils/workLogs.js'
import { MANAGER_WORK_LOG_COLUMNS } from './managerConfig.js'

/**
 * Read-only workdays on the manager's active projects, including people who report to another
 * manager (shown without pay), filtered by date, person, project and milestone.
 */
export function WorkLogsPage({ logs, employees, projects, milestones }) {
  const { filters, setFilter } = useFilters({ from: '', to: '', employee: '', project: '', milestone: '' })
  const visible = logs.filter((log) => matchesWorkLogFilters(log, filters))
  const projectId = Number(filters.project)
  // Your employees, plus anyone else who logged time on your projects.
  const people = uniqueBy([...employees, ...logs.map((log) => log.employee)], (person) => person.id)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <PageHeading
        eyebrow="Review time"
        title="Work logs"
        description="Read-only workdays on your active projects. Pay shows only for your own employees."
      />
      <Panel>
        <div className="toolbar toolbar-wrap">
          <WorkLogFilters
            filters={filters}
            setFilter={setFilter}
            selects={[
              { name: 'employee', label: 'Employee', allLabel: 'All employees', options: people },
              { name: 'project', label: 'Project', allLabel: 'All projects', options: projects },
              {
                name: 'milestone',
                label: 'Milestone',
                allLabel: 'All milestones',
                options: milestones.filter((item) => !projectId || item.project_id === projectId),
              },
            ]}
          />
        </div>
        <div className="info-strip in-panel">
          <Clock3 size={16} />
          Each entry is one 8-hour weekday. Employees can log only one project
          per day and can’t backdate. Closed and archived project logs aren’t shown.
        </div>
        <WorkLogTable
          key={JSON.stringify(filters)}
          logs={visible}
          columns={MANAGER_WORK_LOG_COLUMNS}
          emptyBody="No entries match these filters."
        />
      </Panel>
    </>
  )
}
