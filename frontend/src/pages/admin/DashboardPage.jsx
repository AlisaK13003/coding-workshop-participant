import { useState } from 'react'
import {
  CheckCircle2,
  CircleAlert,
  FolderKanban,
  Plus,
  Users,
} from 'lucide-react'
import { ActivityList } from '../../components/activity/ActivityList.jsx'
import { DeadlinesPanel } from '../../components/projects/DeadlinesPanel.jsx'
import {
  Badge,
  Button,
  PageHeading,
  Panel,
  QueryContent,
  StatCard,
  ViewAllButton,
} from '../../components/ui'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'
import { combineQueries, useApiQuery } from '../../hooks/useApiQuery.js'
import { useCurrentUser } from '../../hooks/useSession.js'
import { listActivity } from '../../services/activityApi.js'
import { listMilestonesForProjects } from '../../services/milestonesApi.js'
import { listUsers } from '../../services/usersApi.js'
import { listWorkLogs } from '../../services/workLogsApi.js'
import { toActivityItem } from '../../utils/activity.js'
import { daysBetween, toIsoDate, todayIso } from '../../utils/calendar.js'
import { formatHours, formatMoney, greeting } from '../../utils/format.js'
import { getPendingReviews } from '../../utils/milestones.js'
import {
  isEndingSoon,
  isOpenProject,
  isProjectOverBudget,
  needsManager,
} from '../../utils/projects.js'
import { listWords, pluralize } from '../../utils/text.js'
import { ROLES } from '../../utils/users.js'
import { getMonthlyTotals, sumCost, sumHours } from '../../utils/workLogs.js'
import { ADMIN_PAGES, DASHBOARD_VIEWS } from './adminConfig.js'
import { DashboardFocusPanel } from './DashboardFocusPanel.jsx'
import { HoursChart } from './HoursChart.jsx'
import './DashboardPage.css'

const CHART_MONTHS = 6

/** "1 admin · 2 managers · 5 employees". */
function countRoles(users) {
  return ROLES.map((role) => {
    const count = users.filter((user) => user.role === role).length
    return `${count} ${pluralize(count, role)}`
  }).join(' · ')
}

/** "1 project needs a manager and 2 milestone reviews are pending"; parts with nothing to report are left out. */
function attentionSummary({ unassigned, overBudget, reviews }) {
  const parts = [
    unassigned && `${unassigned} ${pluralize(unassigned, 'project needs', 'projects need')} a manager`,
    overBudget && `${overBudget} ${pluralize(overBudget, 'project is', 'projects are')} over budget`,
    reviews && `${reviews} milestone ${pluralize(reviews, 'review is', 'reviews are')} pending`,
  ].filter(Boolean)
  return `${listWords(parts)}.`
}

function oldestRequestNote(reviews) {
  if (!reviews.length) return 'No requests waiting'
  const days = daysBetween(reviews[0].pending_review.requested_at.slice(0, 10), todayIso())
  return days ? `Oldest request is ${days} ${pluralize(days, 'day')} old` : 'Oldest request is from today'
}

/**
 * Admin overview: attention items, key numbers, spending and activity. Each stat card
 * selects what the list under the cards shows (active projects by default).
 */
export function DashboardPage({ projects, onOpenProject, onOpenUser, onNavigate, onOpenDialog }) {
  const user = useCurrentUser()
  const [view, setView] = useState(DASHBOARD_VIEWS.active)
  const cardProps = (cardView) => ({ selected: view === cardView, onSelect: () => setView(cardView) })
  const active = projects.filter(isOpenProject)
  const activeIds = active.map((project) => project.id)
  const chartStart = new Date()
  chartStart.setMonth(chartStart.getMonth() - (CHART_MONTHS - 1), 1)

  const stats = combineQueries(
    useApiQuery(() => listUsers(), []),
    useApiQuery(() => listMilestonesForProjects(activeIds), [activeIds]),
  )
  const logs = useApiQuery(() => listWorkLogs({ from: toIsoDate(chartStart) }), [toIsoDate(chartStart)])
  const activity = useApiQuery(() => listActivity({ limit: 4 }), [])

  const unassigned = active.filter(needsManager)
  const overBudget = active.filter(isProjectOverBudget)
  const endingSoon = active.filter((project) => isEndingSoon(project))

  return (
    <>
      <PageHeading
        eyebrow="Overview"
        title={`${greeting()}, ${user.first_name}`}
        description="Here’s what needs your attention across the project portfolio."
        actions={
          <>
            <Button variant="secondary" onClick={() => onOpenDialog(DIALOGS.createUser)}>
              <Plus size={16} />
              Create user
            </Button>
            <Button onClick={() => onOpenDialog(DIALOGS.createProject)}>
              <Plus size={16} />
              Create project
            </Button>
          </>
        }
      />
      <QueryContent query={stats} loadingLabel="Loading portfolio numbers…">
        {([users, milestones]) => {
          const reviews = getPendingReviews(milestones)
          const attention = unassigned.length + overBudget.length + reviews.length
          return (
            <>
              {attention > 0 && (
                <Panel className="attention-panel">
                  <div>
                    <span className="attention-icon">
                      <CircleAlert size={19} />
                    </span>
                    <p>
                      <strong>
                        {attention} {pluralize(attention, 'item needs', 'items need')} attention
                      </strong>
                      <span>
                        {attentionSummary({
                          unassigned: unassigned.length,
                          overBudget: overBudget.length,
                          reviews: reviews.length,
                        })}
                      </span>
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => onNavigate(ADMIN_PAGES.projects)}>
                    Review projects
                  </Button>
                </Panel>
              )}
              <div className="stats-grid">
                <StatCard
                  label="Active projects"
                  value={active.length}
                  note={`${endingSoon.length} approaching end dates`}
                  icon={FolderKanban}
                  {...cardProps(DASHBOARD_VIEWS.active)}
                />
                <StatCard
                  label="Awaiting assignment"
                  value={unassigned.length}
                  note="Open projects without a manager"
                  icon={CircleAlert}
                  {...cardProps(DASHBOARD_VIEWS.unassigned)}
                />
                <StatCard
                  label="Total users"
                  value={users.length}
                  note={countRoles(users)}
                  icon={Users}
                  {...cardProps(DASHBOARD_VIEWS.users)}
                />
                <StatCard
                  label="Pending reviews"
                  value={reviews.length}
                  note={oldestRequestNote(reviews)}
                  icon={CheckCircle2}
                  {...cardProps(DASHBOARD_VIEWS.reviews)}
                />
              </div>
              <DashboardFocusPanel
                view={view}
                active={active}
                unassigned={unassigned}
                users={users}
                reviews={reviews}
                onOpenProject={onOpenProject}
                onOpenUser={onOpenUser}
                onNavigate={onNavigate}
                onOpenDialog={onOpenDialog}
              />
            </>
          )
        }}
      </QueryContent>
      <div className="dashboard-lower">
        <Panel
          title="Hours & labor spending"
          description={`Last ${CHART_MONTHS} months, all projects`}
          actions={
            logs.data && (
              <div className="chart-totals">
                <Badge>{formatHours(sumHours(logs.data))} total</Badge>
                <Badge>{formatMoney(sumCost(logs.data))} spent</Badge>
              </div>
            )
          }
        >
          <QueryContent query={logs} loadingLabel="Loading work logs…">
            {(rows) => <HoursChart data={getMonthlyTotals(rows, CHART_MONTHS)} />}
          </QueryContent>
        </Panel>
        <DeadlinesPanel
          title="Approaching end dates"
          description="Within the next 60 days"
          projects={active}
          onOpenProject={onOpenProject}
          onViewAll={() => onNavigate(ADMIN_PAGES.calendar)}
        />
      </div>
      <Panel
        title="Recent activity"
        description="The latest changes across the workspace"
        actions={<ViewAllButton onClick={() => onNavigate(ADMIN_PAGES.activity)} />}
      >
        <QueryContent query={activity} loadingLabel="Loading activity…">
          {(page) => <ActivityList items={page.items.map(toActivityItem)} />}
        </QueryContent>
      </Panel>
    </>
  )
}
