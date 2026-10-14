import { MilestoneStatusBadge } from '../milestones/MilestoneStatusBadge.jsx'
import { Phase } from '../ui'
import { daysBetween, todayIso } from '../../utils/calendar.js'
import { toDateTile } from '../../utils/format.js'
import { openMilestones } from '../../utils/milestones.js'
import { getProjectPhase, isOpenProject } from '../../utils/projects.js'
import { DeadlineList } from './DeadlineList.jsx'

/**
 * The next end dates of open projects (and, if given, their open milestones),
 * soonest first, from today up to `withinDays` days ahead.
 */
export function UpcomingDeadlines({ projects, milestones = [], withinDays = 60, limit = 4 }) {
  const today = todayIso()
  const isUpcoming = (date) => {
    const days = daysBetween(today, date)
    return days >= 0 && days <= withinDays
  }
  const projectItems = projects
    .filter((project) => isOpenProject(project) && isUpcoming(project.end_date))
    .map((project) => ({
      key: `project-${project.id}`,
      date: project.end_date,
      title: project.name,
      detail: `Predicted project end · ${project.manager?.name ?? 'No manager'}`,
      status: <Phase value={getProjectPhase(project)} />,
    }))
  const milestoneItems = openMilestones(milestones)
    .filter((milestone) => isUpcoming(milestone.end_date))
    .map((milestone) => ({
      key: `milestone-${milestone.id}`,
      date: milestone.end_date,
      title: milestone.name,
      detail: `Milestone end · ${projects.find((project) => project.id === milestone.project_id)?.name ?? ''}`,
      status: <MilestoneStatusBadge status={milestone.status} />,
    }))
  const items = [...projectItems, ...milestoneItems]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit)
    .map((item) => ({ ...item, ...toDateTile(item.date) }))

  return <DeadlineList items={items} emptyBody={`Nothing ends in the next ${withinDays} days.`} />
}
