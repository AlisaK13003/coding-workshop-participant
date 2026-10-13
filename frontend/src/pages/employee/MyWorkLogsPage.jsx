import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import {
  EmptyState,
  Input,
  PageHeading,
  Panel,
  Select,
} from '../../components/ui'
import { EmployeeWorkLogTable } from './EmployeeWorkLogTable.jsx'
import './MyWorkLogsPage.css'

const ALL_PROJECTS = 'All projects'
const ALL_MILESTONES = 'All milestones'

/** The employee's own workdays, filterable by date range, project and milestone. */
export function MyWorkLogsPage({ projects, milestones, logs }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [project, setProject] = useState(ALL_PROJECTS)
  const [milestone, setMilestone] = useState(ALL_MILESTONES)
  const visible = logs.filter(
    (log) =>
      (!start || log.date >= start) &&
      (!end || log.date <= end) &&
      (project === ALL_PROJECTS || log.projectId === Number(project)) &&
      (milestone === ALL_MILESTONES || log.milestoneId === Number(milestone)),
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
              value={start}
              onChange={(event) => setStart(event.target.value)}
              aria-label="Start date"
            />
            <Input
              type="date"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              aria-label="End date"
            />
            <Select value={project} onChange={setProject}>
              <option>{ALL_PROJECTS}</option>
              {projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select value={milestone} onChange={setMilestone}>
              <option>{ALL_MILESTONES}</option>
              {milestones.map((item) => (
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
          archived project logs are not shown here.
        </div>
        {visible.length ? (
          <EmployeeWorkLogTable
            logs={visible}
            projects={projects}
            milestones={milestones}
            showSubmitted
          />
        ) : (
          <EmptyState
            title="No visible entries"
            body="No work logs match these filters."
          />
        )}
      </Panel>
    </>
  )
}
