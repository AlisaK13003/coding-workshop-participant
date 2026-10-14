import { useState } from 'react'
import { CircleAlert, Clock3, FolderKanban, Send } from 'lucide-react'
import { EmptyState, PageHeading, Panel, StatCard } from '../../components/ui'
import { useCurrentUser } from '../../hooks/useSession.js'
import { greeting } from '../../utils/format.js'
import { ASSIGNMENT_STATE } from '../../utils/milestones.js'
import { getWeekLogs, sumHours } from '../../utils/workLogs.js'
import { DashboardFocusPanel } from './DashboardFocusPanel.jsx'
import { EMPLOYEE_DASHBOARD_VIEWS } from './employeeConfig.js'
import { RecentNotifications } from './RecentNotifications.jsx'
import { TodayWorkCard } from './TodayWorkCard.jsx'
import './DashboardPage.css'

/**
 * Employee home: today's logging, key numbers and notifications. Each stat card selects what
 * the list under the cards shows (assignments by default).
 */
export function DashboardPage({
  assignments,
  logs,
  notices,
  selectedProjectId,
  onSelectProject,
  onLog,
  onReview,
  onOpenProject,
  onSelectNotice,
  onNavigate,
}) {
  const user = useCurrentUser()
  const [view, setView] = useState(EMPLOYEE_DASHBOARD_VIEWS.projects)
  const cardProps = (cardView) => ({ selected: view === cardView, onSelect: () => setView(cardView) })
  const reviews = assignments.filter(({ state }) => state === ASSIGNMENT_STATE.review)
  const weekLogs = getWeekLogs(logs)

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
          {...cardProps(EMPLOYEE_DASHBOARD_VIEWS.projects)}
        />
        <StatCard
          label="Hours this week"
          value={`${sumHours(weekLogs)} h`}
          note="Monday to today, visible projects only"
          icon={Clock3}
          {...cardProps(EMPLOYEE_DASHBOARD_VIEWS.hours)}
        />
        <StatCard
          label="Pending reviews"
          value={reviews.length}
          note="Awaiting your manager’s decision"
          icon={Send}
          {...cardProps(EMPLOYEE_DASHBOARD_VIEWS.reviews)}
        />
      </div>
      <DashboardFocusPanel
        view={view}
        assignments={assignments}
        weekLogs={weekLogs}
        logs={logs}
        reviews={reviews}
        onOpenProject={onOpenProject}
        onReview={onReview}
        onNavigate={onNavigate}
      />
      <Panel title="Recent notifications" description="Assignment and milestone updates.">
        {notices.length ? (
          <RecentNotifications items={notices.slice(0, 4)} onSelect={onSelectNotice} />
        ) : (
          <EmptyState title="You’re all caught up" body="New assignment and review updates appear here." />
        )}
      </Panel>
      <div className="scope-footnote">
        <CircleAlert size={15} />
        Weekly totals include only visible active projects. Hidden historical
        logs are not evidence of missed work.
      </div>
    </>
  )
}
