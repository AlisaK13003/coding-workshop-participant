import { useState } from 'react'
import { Clock3 } from 'lucide-react'
import {
  EmptyState,
  Input,
  PageHeading,
  Panel,
  Select,
} from '../../components/ui'
import { fullName } from '../../utils/format.js'
import { ManagerWorkLogTable } from './ManagerWorkLogTable.jsx'
import './WorkLogsPage.css'

const ALL_EMPLOYEES = 'All employees'
const ALL_PROJECTS = 'All projects'
const ALL_MILESTONES = 'All milestones'

/** Read-only workdays for the manager's employees, filterable by date, person, project and milestone. */
export function WorkLogsPage({ logs, employees, projects, milestones }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [employee, setEmployee] = useState(ALL_EMPLOYEES)
  const [project, setProject] = useState(ALL_PROJECTS)
  const [milestone, setMilestone] = useState(ALL_MILESTONES)
  const visible = logs.filter(
    (log) =>
      (!startDate || log.date >= startDate) &&
      (!endDate || log.date <= endDate) &&
      (employee === ALL_EMPLOYEES || log.employeeId === Number(employee)) &&
      (project === ALL_PROJECTS || log.projectId === Number(project)) &&
      (milestone === ALL_MILESTONES || log.milestoneId === Number(milestone)),
  )
  const projectMilestones = milestones.filter((item) =>
    projects.some((projectItem) => projectItem.id === item.projectId),
  )

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
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              aria-label="Start date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              aria-label="End date"
            />
            <Select value={employee} onChange={setEmployee}>
              <option>{ALL_EMPLOYEES}</option>
              {employees.map((item) => (
                <option value={item.id} key={item.id}>
                  {fullName(item)}
                </option>
              ))}
            </Select>
            <Select value={project} onChange={setProject}>
              <option>{ALL_PROJECTS}</option>
              {projects.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select value={milestone} onChange={setMilestone}>
              <option>{ALL_MILESTONES}</option>
              {projectMilestones.map((item) => (
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
          per day and cannot backdate. Hidden or absent entries do not prove an
          employee did not work.
        </div>
        {visible.length ? (
          <ManagerWorkLogTable
            logs={visible}
            employees={employees}
            projects={projects}
            milestones={milestones}
          />
        ) : (
          <EmptyState
            title="No visible work logs"
            body="No entries match these filters. Closed and archived project logs are not available to managers."
          />
        )}
      </Panel>
    </>
  )
}
