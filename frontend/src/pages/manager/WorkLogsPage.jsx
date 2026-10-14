import { useState } from 'react'
import { Clock3 } from 'lucide-react'
import { Input, PageHeading, Panel, Select } from '../../components/ui'
import { WorkLogTable } from '../../components/worklogs/WorkLogTable.jsx'
import { MANAGER_WORK_LOG_COLUMNS } from './managerConfig.js'
import './WorkLogsPage.css'

/**
 * Read-only workdays for the manager's employees on their active projects
 * (already loaded with the workspace), filtered by date, person, project and milestone.
 */
export function WorkLogsPage({ logs, employees, projects, milestones }) {
  const [filters, setFilters] = useState({ from: '', to: '', employee: '', project: '', milestone: '' })
  const setFilter = (name) => (value) => setFilters((current) => ({ ...current, [name]: value }))
  const matches = (id, value) => !value || id === Number(value)
  const visible = logs.filter(
    (log) =>
      (!filters.from || log.work_date >= filters.from) &&
      (!filters.to || log.work_date <= filters.to) &&
      matches(log.employee.id, filters.employee) &&
      matches(log.project.id, filters.project) &&
      matches(log.milestone.id, filters.milestone),
  )
  const milestoneChoices = milestones.filter((item) => matches(item.project_id, filters.project))

  return (
    <>
      <PageHeading
        eyebrow="Review time"
        title="Work logs"
        description="Read-only workdays for your employees on your active projects."
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
            <Select value={filters.employee} onChange={setFilter('employee')} aria-label="Employee">
              <option value="">All employees</option>
              {employees.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select value={filters.project} onChange={setFilter('project')} aria-label="Project">
              <option value="">All projects</option>
              {projects.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select value={filters.milestone} onChange={setFilter('milestone')} aria-label="Milestone">
              <option value="">All milestones</option>
              {milestoneChoices.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="info-strip manager-log-note">
          <Clock3 size={16} />
          Each entry is one 8-hour weekday. Employees can log only one project
          per day and can’t backdate. Closed and archived project logs aren’t shown.
        </div>
        <WorkLogTable
          logs={visible}
          columns={MANAGER_WORK_LOG_COLUMNS}
          emptyBody="No entries match these filters."
        />
      </Panel>
    </>
  )
}
