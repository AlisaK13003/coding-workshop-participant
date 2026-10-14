import { ActivityList } from '../../../components/activity/ActivityList.jsx'
import { Panel, QueryContent } from '../../../components/ui'
import { useApiQuery } from '../../../hooks/useApiQuery.js'
import { listActivity } from '../../../services/activityApi.js'
import { toActivityItem } from '../../../utils/activity.js'

const LIMIT = 50

/** The latest assignment, milestone, budget and status changes on the project. */
export function ActivityTab({ project }) {
  const activity = useApiQuery(() => listActivity({ project_id: project.id, limit: LIMIT }), [project.id])
  return (
    <Panel
      title="Project activity"
      description={`The latest ${LIMIT} assignment, milestone, budget and status changes.`}
    >
      <QueryContent query={activity} loadingLabel="Loading activity…">
        {(page) => <ActivityList items={page.items.map(toActivityItem)} />}
      </QueryContent>
    </Panel>
  )
}
