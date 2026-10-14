import { ChevronRight } from 'lucide-react'
import { ReviewQueue } from '../../components/milestones/ReviewQueue.jsx'
import { Button, EmptyState, Panel } from '../../components/ui'
import { UserTable } from '../../components/users/UserTable.jsx'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'
import { ADMIN_PAGES, DASHBOARD_VIEWS } from './adminConfig.js'
import { ProjectTable } from './ProjectTable.jsx'

function ViewAll({ onClick }) {
  return (
    <Button variant="ghost" onClick={onClick}>
      View all <ChevronRight size={16} />
    </Button>
  )
}

/** The list for the selected dashboard card: active projects, projects needing a manager, users or reviews. */
export function DashboardFocusPanel({
  view, active, unassigned, users, reviews, onOpenProject, onOpenUser, onNavigate, onOpenDialog,
}) {
  switch (view) {
    case DASHBOARD_VIEWS.unassigned:
      return (
        <Panel
          title="Projects awaiting a manager"
          description="Open projects without a manager, e.g. after being unarchived. Open one and edit it to assign a manager."
        >
          {unassigned.length ? (
            <ProjectTable projects={unassigned} onOpen={onOpenProject} compact />
          ) : (
            <EmptyState title="Every open project has a manager" body="Nothing to assign right now." />
          )}
        </Panel>
      )
    case DASHBOARD_VIEWS.users:
      return (
        <Panel
          title="Users"
          description="Everyone with an active account. Select someone to see their details."
          actions={<ViewAll onClick={() => onNavigate(ADMIN_PAGES.users)} />}
        >
          {users.length ? (
            <UserTable users={users} onOpen={onOpenUser} compact />
          ) : (
            <EmptyState title="No users yet" body="Create a user to get started." />
          )}
        </Panel>
      )
    case DASHBOARD_VIEWS.reviews:
      return (
        <ReviewQueue
          reviews={reviews}
          projects={active}
          onReview={(milestone) => onOpenDialog(DIALOGS.reviewMilestone, { milestone })}
        />
      )
    default:
      return (
        <Panel
          title="Active projects"
          description="Schedule, milestones, hours, and budget at a glance."
          actions={<ViewAll onClick={() => onNavigate(ADMIN_PAGES.projects)} />}
        >
          {active.length ? (
            <ProjectTable projects={active} onOpen={onOpenProject} compact />
          ) : (
            <EmptyState title="No active projects" body="Create a project to get started." />
          )}
        </Panel>
      )
  }
}
