import { UserPlus } from 'lucide-react'
import { ReviewQueue } from '../../components/milestones/ReviewQueue.jsx'
import { Button, EmptyState, Pager, Panel, ViewAllButton } from '../../components/ui'
import { UserTable } from '../../components/users/UserTable.jsx'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'
import { usePagination } from '../../hooks/usePagination.js'
import { ADMIN_PAGES, DASHBOARD_VIEWS } from './adminConfig.js'
import { ProjectTable } from './ProjectTable.jsx'

const PAGE_SIZE = 5

/**
 * The list for the selected dashboard card: active projects, projects needing a manager,
 * users or reviews, five at a time. Keyed by view, so switching cards starts at page 1.
 */
export function DashboardFocusPanel(props) {
  return <FocusPanel key={props.view} {...props} />
}

function FocusPanel({
  view, active, unassigned, users, reviews, onOpenProject, onOpenUser, onNavigate, onOpenDialog,
}) {
  const items = { unassigned, users, reviews }[view] ?? active
  const pages = usePagination(items, PAGE_SIZE)
  const pager = items.length > 0 && <Pager {...pages} />

  switch (view) {
    case DASHBOARD_VIEWS.unassigned:
      return (
        <Panel
          title="Projects awaiting a manager"
          description="Open projects without a manager, e.g. after being unarchived."
        >
          {unassigned.length ? (
            <ProjectTable
              projects={pages.pageItems}
              onOpen={onOpenProject}
              compact
              hideManager
              rowAction={(project) => (
                <Button variant="secondary" onClick={() => onOpenDialog(DIALOGS.assignManager, { project })}>
                  <UserPlus size={15} />
                  Assign manager
                </Button>
              )}
            />
          ) : (
            <EmptyState title="Every open project has a manager" body="Nothing to assign right now." />
          )}
          {pager}
        </Panel>
      )
    case DASHBOARD_VIEWS.users:
      return (
        <Panel
          title="Users"
          description="Everyone with an active account. Select someone to see their details."
          actions={<ViewAllButton onClick={() => onNavigate(ADMIN_PAGES.users)} />}
        >
          {users.length ? (
            <UserTable users={pages.pageItems} onOpen={onOpenUser} compact />
          ) : (
            <EmptyState title="No users yet" body="Create a user to get started." />
          )}
          {pager}
        </Panel>
      )
    case DASHBOARD_VIEWS.reviews:
      return (
        <ReviewQueue
          reviews={pages.pageItems}
          total={reviews.length}
          footer={pager}
          projects={active}
          onReview={(milestone) => onOpenDialog(DIALOGS.reviewMilestone, { milestone })}
        />
      )
    default:
      return (
        <Panel
          title="Active projects"
          description="Schedule, milestones, hours, and budget at a glance."
          actions={<ViewAllButton onClick={() => onNavigate(ADMIN_PAGES.projects)} />}
        >
          {active.length ? (
            <ProjectTable projects={pages.pageItems} onOpen={onOpenProject} compact />
          ) : (
            <EmptyState title="No active projects" body="Create a project to get started." />
          )}
          {pager}
        </Panel>
      )
  }
}
