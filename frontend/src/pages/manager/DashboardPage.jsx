import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
} from 'lucide-react'
import { DeadlinesPanel } from '../../components/projects/DeadlinesPanel.jsx'
import { Badge, EmptyState, PageHeading, Panel, StatCard } from '../../components/ui'
import { useCurrentUser } from '../../hooks/useSession.js'
import { greeting } from '../../utils/format.js'
import { getPendingReviews } from '../../utils/milestones.js'
import { isEndingSoon, isProjectOverBudget } from '../../utils/projects.js'
import { AttentionList } from './AttentionList.jsx'
import { getAssignmentAttention } from './managerSelectors.js'
import { ManagerProjectTable } from './ManagerProjectTable.jsx'
import { ReviewQueue } from '../../components/milestones/ReviewQueue.jsx'

/** Manager overview: reviews, active projects, assignment attention and deadlines. */
export function DashboardPage({ projects, milestones, members, onOpenProject, onReview, onOpenCalendar }) {
  const user = useCurrentUser()
  const reviews = getPendingReviews(milestones)
  const attention = getAssignmentAttention(members)

  return (
    <>
      <PageHeading
        eyebrow="Manager overview"
        title={`${greeting()}, ${user.first_name}`}
        description="Reviews, deadlines, assignments, and portfolio health for your active projects."
      />
      <div className="stats-grid">
        <StatCard
          label="Active projects"
          value={projects.length}
          note={`${members.length} active assignments`}
          icon={FolderKanban}
          accent
        />
        <StatCard
          label="Pending reviews"
          value={reviews.length}
          note="Milestone completion requests"
          icon={CheckCircle2}
        />
        <StatCard
          label="Approaching end date"
          value={projects.filter((project) => isEndingSoon(project)).length}
          note="Within the next 60 days"
          icon={CalendarDays}
        />
        <StatCard
          label="Projects over budget"
          value={projects.filter(isProjectOverBudget).length}
          note="Budget and schedule are tracked separately"
          icon={AlertTriangle}
        />
      </div>
      <ReviewQueue reviews={reviews} projects={projects} onReview={onReview} />
      <Panel
        title="Active projects"
        description="Health, milestone completion, logged hours, and budget usage are separate measures."
      >
        {projects.length ? (
          <ManagerProjectTable projects={projects} onOpen={(project) => onOpenProject(project.id)} compact />
        ) : (
          <EmptyState title="No active projects" body="Projects an admin assigns to you appear here." />
        )}
      </Panel>
      <div className="dashboard-lower">
        <Panel
          title="Assignment attention"
          description="Employees waiting or without a milestone."
          actions={<Badge tone="Amber">{attention.length} need attention</Badge>}
        >
          {attention.length ? (
            <AttentionList items={attention} projects={projects} onOpenProject={onOpenProject} />
          ) : (
            <EmptyState title="Everyone can work" body="Every employee has an available milestone." />
          )}
        </Panel>
        <DeadlinesPanel
          title="Upcoming deadlines"
          description="Project and milestone end dates in the next 60 days."
          projects={projects}
          milestones={milestones}
          onOpenProject={(project) => onOpenProject(project.id)}
          onViewAll={onOpenCalendar}
        />
      </div>
    </>
  )
}
