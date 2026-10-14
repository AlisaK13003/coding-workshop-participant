import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { Input, PageHeading, Panel, Select } from '../../components/ui'
import { WorkLogTable } from '../../components/worklogs/WorkLogTable.jsx'
import { EMPLOYEE_WORK_LOG_COLUMNS } from './employeeConfig.js'
import './MyWorkLogsPage.css'

/** The employee's own workdays, filterable by date range, project and milestone. */
export function MyWorkLogsPage({ assignments, milestones, logs }) {
  const [filters, setFilters] = useState({ from: '', to: '', project: '', milestone: '' })
  const setFilter = (name) => (value) => setFilters((current) => ({ ...current, [name]: value }))
  const matches = (id, value) => !value || id === Number(value)
  const visible = logs.filter(
    (log) =>
      (!filters.from || log.work_date >= filters.from) &&
      (!filters.to || log.work_date <= filters.to) &&
      matches(log.project.id, filters.project) &&
      matches(log.milestone.id, filters.milestone),
  )

  return (
    <>
      <PageHeading
        eyebrow="Your history"
        title="My work logs"
        description="Read-only entries from your visible active projects."
      />
      <Panel>
        <div className="toolbar toolbar-wrap">
          <div className="filters">
            <Input
              type="date"
              value={filters.from}
              onChange={(event) => setFilter('from')(event.target.value)}
              aria-label="Start date"
            />
            <Input
              type="date"
              value={filters.to}
              onChange={(event) => setFilter('to')(event.target.value)}
              aria-label="End date"
            />
            <Select value={filters.project} onChange={setFilter('project')} aria-label="Project">
              <option value="">All projects</option>
              {assignments.map(({ project }) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
            <Select value={filters.milestone} onChange={setFilter('milestone')} aria-label="Milestone">
              <option value="">All milestones</option>
              {milestones
                .filter((item) => matches(item.project_id, filters.project))
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </Select>
          </div>
        </div>
        <div className="info-strip employee-log-note">
          <CircleAlert size={16} />
          For corrections or historical entries, contact an admin. Closed and
          archived project logs aren’t shown here.
        </div>
        <WorkLogTable logs={visible} columns={[...EMPLOYEE_WORK_LOG_COLUMNS, 'submitted']} />
      </Panel>
    </>
  )
}
