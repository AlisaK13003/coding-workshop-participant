import { CircleAlert } from 'lucide-react'
import { PageHeading, Panel } from '../../components/ui'
import { WorkLogFilters } from '../../components/worklogs/WorkLogFilters.jsx'
import { WorkLogTable } from '../../components/worklogs/WorkLogTable.jsx'
import { useFilters } from '../../hooks/useFilters.js'
import { matchesWorkLogFilters } from '../../utils/workLogs.js'
import { EMPLOYEE_WORK_LOG_COLUMNS } from './employeeConfig.js'

/** The employee's own workdays, filterable by date range, project and milestone. */
export function MyWorkLogsPage({ assignments, milestones, logs }) {
  const { filters, setFilter } = useFilters({ from: '', to: '', project: '', milestone: '' })
  const visible = logs.filter((log) => matchesWorkLogFilters(log, filters))
  const projectId = Number(filters.project)

  return (
    <>
      <PageHeading
        eyebrow="Your history"
        title="My work logs"
        description="Read-only entries from your visible active projects."
      />
      <Panel>
        <div className="toolbar toolbar-wrap">
          <WorkLogFilters
            filters={filters}
            setFilter={setFilter}
            selects={[
              {
                name: 'project',
                label: 'Project',
                allLabel: 'All projects',
                options: assignments.map(({ project }) => project),
              },
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
          <CircleAlert size={16} />
          For corrections or historical entries, contact an admin. Closed and
          archived project logs aren’t shown here.
        </div>
        <WorkLogTable logs={visible} columns={[...EMPLOYEE_WORK_LOG_COLUMNS, 'submitted']} />
      </Panel>
    </>
  )
}
