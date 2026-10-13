import { ActivityList } from '../../../components/activity/ActivityList.jsx'
import { Panel } from '../../../components/ui'
import { activities } from '../../../data/adminData.js'

// Prototype sample filter for "this project's" activity.
const projectActivities = activities.filter(
  (item) =>
    item.record.includes('Customer') ||
    item.record.includes('Design') ||
    item.action.includes('budget'),
)

/** Assignment, milestone, budget and status changes for the project. */
export function ActivityTab() {
  return (
    <Panel
      title="Project activity"
      description="Assignment, milestone, budget, and status changes."
    >
      <ActivityList items={projectActivities} />
    </Panel>
  )
}
