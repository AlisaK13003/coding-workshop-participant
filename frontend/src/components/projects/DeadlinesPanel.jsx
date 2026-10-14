import { Panel, Phase, ViewAllButton } from '../ui'
import { daysBetween, todayIso } from '../../utils/calendar.js'
import { toDateTile } from '../../utils/format.js'
import { getMilestoneHealth, openMilestones } from '../../utils/milestones.js'
import { getProjectPhase, isOpenProject } from '../../utils/projects.js'
import { DeadlineList } from './DeadlineList.jsx'

/**
 * Panel of the next end dates of open projects (and, if given, their open milestones, with
 * deadline health from getMilestoneHealth),
 * soonest first, from today up to `withinDays` days ahead, showing at most `limit`.
 * With onOpenProject(project), each row opens its project (a milestone opens its project).
 * "View all" calls onViewAll (e.g. the calendar) and is disabled when nothing is hidden.
 */
export function DeadlinesPanel({
  title, description, projects, milestones = [], withinDays = 60, limit = 3, onOpenProject, onViewAll,
}) {
  const opener = (project) => (onOpenProject && project ? () => onOpenProject(project) : undefined)
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
      onClick: opener(project),
    }))
  const milestoneItems = openMilestones(milestones)
    .filter((milestone) => isUpcoming(milestone.end_date))
    .map((milestone) => {
      const project = projects.find(({ id }) => id === milestone.project_id)
      const health = getMilestoneHealth(milestone, today)
      return {
        key: `milestone-${milestone.id}`,
        date: milestone.end_date,
        title: milestone.name,
        detail: `Milestone end · ${project?.name ?? ''}`,
        status: <Phase value={health.phase} title={health.reason} />,
        onClick: opener(project),
      }
    })
  const all = [...projectItems, ...milestoneItems].sort((a, b) => a.date.localeCompare(b.date))
  const items = all.slice(0, limit).map((item) => ({ ...item, ...toDateTile(item.date) }))
  const hidden = all.length - items.length

  return (
    <Panel
      title={title}
      description={description}
      actions={
        onViewAll && (
          <ViewAllButton
            onClick={onViewAll}
            disabled={hidden === 0}
            title={hidden === 0 ? 'Everything coming up is shown' : `${hidden} more in the calendar`}
          />
        )
      }
    >
      <DeadlineList items={items} emptyBody={`Nothing ends in the next ${withinDays} days.`} />
    </Panel>
  )
}
