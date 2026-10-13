import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
} from 'lucide-react'
import { DeadlineList } from '../../components/projects/DeadlineList.jsx'
import { Badge, PageHeading, Panel, Phase, StatCard } from '../../components/ui'
import { toDateTile } from '../../utils/format.js'
import { MILESTONE_STATUS } from '../../utils/milestones.js'
import { isOverBudget } from '../../utils/schedule.js'
import { AttentionList } from './AttentionList.jsx'
import { getAssignmentAttention, getProjectPhase } from './managerSelectors.js'
import { ManagerProjectTable } from './ManagerProjectTable.jsx'
import { ReviewQueue } from './ReviewQueue.jsx'

function getDeadlineItems(projects) {
  return [...projects]
    .sort((a, b) => a.end.localeCompare(b.end))
    .slice(0, 4)
    .map((project) => ({
      key: project.id,
      ...toDateTile(project.end),
      title: project.name,
      detail: 'Predicted project end',
      status: <Phase value={getProjectPhase(project)} />,
    }))
}

/** Manager overview: reviews, active projects, assignment attention and deadlines. */
export function DashboardPage({
  projects,
  milestones,
  employees,
  onOpenProject,
  onReview,
}) {
  const reviewCount = milestones.filter(
    (milestone) => milestone.status === MILESTONE_STATUS.review,
  ).length
  const overBudgetCount = projects.filter((project) =>
    isOverBudget(project.cost, project.budget),
  ).length
  const assignmentCount = projects.reduce(
    (sum, project) => sum + project.employeeIds.length,
    0,
  )
  const attention = getAssignmentAttention(employees, projects, milestones)

  return (
    <>
      <PageHeading
        eyebrow="Manager overview"
        title="Good morning, Maya"
        description="Reviews, deadlines, assignments, and portfolio health for your active projects."
      />
      <div className="stats-grid">
        <StatCard
          label="Active projects"
          value={`${projects.length}`}
          note={`${assignmentCount} active assignments`}
          icon={FolderKanban}
          accent
        />
        <StatCard
          label="Pending reviews"
          value={`${reviewCount}`}
          note="Milestone completion requests"
          icon={CheckCircle2}
        />
        <StatCard
          label="Approaching end date"
          value="2"
          note="Within the next 60 days"
          icon={CalendarDays}
        />
        <StatCard
          label="Projects over budget"
          value={`${overBudgetCount}`}
          note="Budget and schedule are tracked separately"
          icon={AlertTriangle}
        />
      </div>
      <ReviewQueue
        milestones={milestones}
        projects={projects}
        onReview={onReview}
      />
      <Panel
        title="Active projects"
        description="Schedule phase, milestone completion, logged hours, and budget usage are separate measures."
      >
        <ManagerProjectTable
          projects={projects}
          milestones={milestones}
          onOpen={(project) => onOpenProject(project.id)}
          compact
        />
      </Panel>
      <div className="dashboard-lower">
        <Panel
          title="Assignment attention"
          description="Employees waiting or without a milestone."
          actions={<Badge tone="Amber">{attention.length} need attention</Badge>}
        >
          <AttentionList
            items={attention}
            projects={projects}
            onOpenProject={onOpenProject}
          />
        </Panel>
        <Panel
          title="Upcoming deadlines"
          description="Project and milestone target dates."
        >
          <DeadlineList items={getDeadlineItems(projects)} />
        </Panel>
      </div>
    </>
  )
}
