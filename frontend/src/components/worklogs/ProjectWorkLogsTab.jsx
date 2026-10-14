import { Panel, QueryContent } from '../ui'
import { useApiQuery } from '../../hooks/useApiQuery.js'
import { listWorkLogs } from '../../services/workLogsApi.js'
import { WorkLogTable } from './WorkLogTable.jsx'

/**
 * Work logs on one project that the user can see (the API filters by role).
 * filters (optional) narrow them further, e.g. { employee_id }. columns are
 * WorkLogTable columns; actions go in the panel header.
 */
export function ProjectWorkLogsTab({ project, filters, columns, title, description, actions }) {
  const logs = useApiQuery(
    () => listWorkLogs({ project_id: project.id, ...filters }),
    [project.id, filters],
  )
  return (
    <Panel title={title ?? 'Project work logs'} description={description} actions={actions}>
      <QueryContent query={logs} loadingLabel="Loading work logs…">
        {(rows) => (
          <WorkLogTable logs={rows} columns={columns} emptyBody="No work has been logged on this project yet." />
        )}
      </QueryContent>
    </Panel>
  )
}
