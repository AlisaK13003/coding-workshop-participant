import { ChevronRight, CircleAlert, Clock3, FolderKanban, Send } from 'lucide-react'
import { ReviewIcon } from '../../components/milestones/ReviewIcon.jsx'
import {
  Badge,
  EmptyState,
  PageHeading,
  Panel,
  StatCard,
} from '../../components/ui'
import { useCurrentUser } from '../../hooks/useSession.js'
import { greeting } from '../../utils/format.js'
import { ASSIGNMENT_STATE } from '../../utils/milestones.js'
import { getWeekHours } from '../../utils/workLogs.js'
import { AssignmentCards } from './AssignmentCards.jsx'
import { RecentNotifications } from './RecentNotifications.jsx'
import { TodayWorkCard } from './TodayWorkCard.jsx'
import './DashboardPage.css'

/** Employee home: today's logging, key numbers, assignments, reviews and notifications. */
export function DashboardPage({
  assignments,
  logs,
  notices,
  selectedProjectId,
  onSelectProject,
  onLog,
  onOpenProject,
  onSelectNotice,
}) {
  const user = useCurrentUser()
  const reviews = assignments.filter(({ state }) => state === ASSIGNMENT_STATE.review)

  return (
    <>
      <PageHeading
        eyebrow="Your workspace"
        title={`${greeting()}, ${user.first_name}`}
        description="See what you can work on today and whether a milestone is ready for review."
      />
      <TodayWorkCard
        assignments={assignments}
        logs={logs}
        selectedProjectId={selectedProjectId}
        onSelectProject={onSelectProject}
        onLog={onLog}
      />
      <div className="employee-stats">
        <StatCard
          label="Active projects"
          value={assignments.length}
          note="Only projects you can currently access"
          icon={FolderKanban}
          accent
        />
        <StatCard
          label="Hours this week"
          value={`${getWeekHours(logs)} h`}
          note="Monday to today, visible projects only"
          icon={Clock3}
        />
        <StatCard
          label="Pending reviews"
          value={reviews.length}
          note="Awaiting your manager’s decision"
          icon={Send}
        />
      </div>
      <Panel title="My project and milestone assignments" description="One current milestone per project.">
        {assignments.length ? (
          <AssignmentCards assignments={assignments} logs={logs} onOpen={onOpenProject} />
        ) : (
          <EmptyState title="No active projects" body="Your manager adds you to projects." />
        )}
      </Panel>
      <div className="dashboard-lower">
        <Panel title="Pending milestone reviews" description="Your request applies to the entire milestone.">
          {reviews.length ? (
            <div className="employee-review-list">
              {reviews.map(({ project, milestone }) => (
                <button key={project.id} onClick={() => onOpenProject(project)}>
                  <ReviewIcon icon={Clock3} size={17} />
                  <p>
                    <strong>{milestone.name}</strong>
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
        <Panel title="Recent notifications" description="Assignment and milestone updates.">
          {notices.length ? (
            <RecentNotifications items={notices.slice(0, 4)} onSelect={onSelectNotice} />
          ) : (
            <EmptyState title="You’re all caught up" body="New assignment and review updates appear here." />
          )}
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
