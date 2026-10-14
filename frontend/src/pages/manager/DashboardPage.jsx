import { useState } from 'react'
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
import { DashboardFocusPanel } from './DashboardFocusPanel.jsx'
import { MANAGER_DASHBOARD_VIEWS } from './managerConfig.js'
import { getAssignmentAttention } from './managerSelectors.js'

/**
 * Manager overview: key numbers, assignment attention and deadlines. Each stat card selects
 * what the list under the cards shows (active projects by default).
 */
export function DashboardPage({ projects, milestones, members, onOpenProject, onReview, onOpenCalendar }) {
  const user = useCurrentUser()
  const [view, setView] = useState(MANAGER_DASHBOARD_VIEWS.active)
  const cardProps = (cardView) => ({ selected: view === cardView, onSelect: () => setView(cardView) })
  const lists = {
    active: projects,
    reviews: getPendingReviews(milestones),
    endingSoon: projects.filter((project) => isEndingSoon(project)),
    overBudget: projects.filter(isProjectOverBudget),
  }
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
          {...cardProps(MANAGER_DASHBOARD_VIEWS.active)}
        />
        <StatCard
          label="Pending reviews"
          value={lists.reviews.length}
          note="Milestone completion requests"
          icon={CheckCircle2}
          {...cardProps(MANAGER_DASHBOARD_VIEWS.reviews)}
        />
        <StatCard
          label="Approaching end date"
          value={lists.endingSoon.length}
          note="Within the next 60 days"
          icon={CalendarDays}
          {...cardProps(MANAGER_DASHBOARD_VIEWS.endingSoon)}
        />
        <StatCard
          label="Projects over budget"
          value={lists.overBudget.length}
          note="Over budget raises health one step"
          icon={AlertTriangle}
          {...cardProps(MANAGER_DASHBOARD_VIEWS.overBudget)}
        />
      </div>
      <DashboardFocusPanel
        view={view}
        lists={lists}
        projects={projects}
        onOpenProject={onOpenProject}
        onReview={onReview}
      />
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
