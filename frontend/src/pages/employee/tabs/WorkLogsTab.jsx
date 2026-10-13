import { Panel } from '../../../components/ui'
import { EmployeeWorkLogTable } from '../EmployeeWorkLogTable.jsx'

/** The employee's own logs on this project. */
export function WorkLogsTab({ project, logs, milestones }) {
  return (
    <Panel
      title="My project work logs"
      description="Previous milestone entries remain visible after reassignment."
    >
      <EmployeeWorkLogTable
        logs={logs.filter((log) => log.projectId === project.id)}
        projects={[project]}
        milestones={milestones}
      />
    </Panel>
  )
}
