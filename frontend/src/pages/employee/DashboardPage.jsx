import { ChevronRight, CircleAlert, Clock3, FolderKanban, Send } from 'lucide-react'
import { ReviewIcon } from '../../components/milestones/ReviewIcon.jsx'
import {
  Badge,
  EmptyState,
  PageHeading,
  Panel,
  StatCard,
} from '../../components/ui'
import { AssignmentCards } from './AssignmentCards.jsx'
import {
  ASSIGNMENT_STATE,
  getCurrentMilestone,
  getProjectsInState,
  getWeekHours,
} from './employeeSelectors.js'
import { RecentNotifications } from './RecentNotifications.jsx'
import { TodayWorkCard } from './TodayWorkCard.jsx'
import './DashboardPage.css'

/** Employee home: today's logging, key numbers, assignments, reviews and notifications. */
export function DashboardPage({
  projects,
  milestones,
  logs,
  notices,
  selectedProjectId,
  onSelectProject,
  onLog,
  onOpenProject,
}) {
  const reviews = getProjectsInState(projects, milestones, ASSIGNMENT_STATE.review)

  return (
    <>
      <PageHeading
        eyebrow="Your workspace"
        title="Good morning, Aisha"
        description="See what you can work on today and whether a milestone is ready for review."
      />
      <TodayWorkCard
        projects={projects}
        milestones={milestones}
        logs={logs}
        selectedProjectId={selectedProjectId}
        onSelectProject={onSelectProject}
        onLog={onLog}
      />
      <div className="employee-stats">
        <StatCard
          label="Active projects"
          value={`${projects.length}`}
          note="Only projects you can currently access"
          icon={FolderKanban}
          accent
        />
        <StatCard
          label="Hours this week"
          value={`${getWeekHours(logs)} h`}
          note="Visible active projects only"
          icon={Clock3}
        />
        <StatCard
          label="Pending reviews"
          value={`${reviews.length}`}
          note="Awaiting your manager’s decision"
          icon={Send}
        />
      </div>
      <Panel
        title="My project and milestone assignments"
        description="One current milestone per project."
      >
        <AssignmentCards
          projects={projects}
          milestones={milestones}
          logs={logs}
          onOpen={onOpenProject}
        />
      </Panel>
      <div className="dashboard-lower">
        <Panel
          title="Pending milestone reviews"
          description="Your request applies to the entire milestone."
        >
          {reviews.length ? (
            <div className="employee-review-list">
              {reviews.map((project) => (
                <button key={project.id} onClick={() => onOpenProject(project)}>
                  <ReviewIcon icon={Clock3} size={17} />
                  <p>
                    <strong>{getCurrentMilestone(milestones, project.id).name}</strong>
                    <span>{project.name}</span>
                  </p>
                  <Badge tone="Awaiting review">Awaiting manager review</Badge>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No pending reviews"
              body="You have no milestone review requests waiting for a manager."
            />
          )}
        </Panel>
        <Panel
          title="Recent notifications"
          description="Assignment and milestone updates."
        >
          <RecentNotifications items={notices.slice(0, 4)} />
        </Panel>
      </div>
      <div className="scope-footnote">
        <CircleAlert size={15} />
        Weekly totals include only visible active projects. Hidden historical
        logs are not evidence of missed work.
      </div>
    </>
  )
}
