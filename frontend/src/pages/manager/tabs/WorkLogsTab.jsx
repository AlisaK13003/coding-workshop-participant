import { Panel } from '../../../components/ui'
import { ManagerWorkLogTable } from '../ManagerWorkLogTable.jsx'

/** Read-only work logs for the project. */
export function WorkLogsTab({ project, logs, employees, milestones }) {
  return (
    <Panel
      title="Project work logs"
      description="Read-only. Admins handle corrections and historical entries."
    >
      <ManagerWorkLogTable
        logs={logs.filter((log) => log.projectId === project.id)}
        employees={employees}
        projects={[project]}
        milestones={milestones}
      />
    </Panel>
  )
}
