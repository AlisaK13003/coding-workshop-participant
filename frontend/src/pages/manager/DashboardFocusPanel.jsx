import { ReviewQueue } from '../../components/milestones/ReviewQueue.jsx'
import { EmptyState, Pager, Panel } from '../../components/ui'
import { usePagination } from '../../hooks/usePagination.js'
import { MANAGER_DASHBOARD_VIEWS } from './managerConfig.js'
import { ManagerProjectTable } from './ManagerProjectTable.jsx'

const PAGE_SIZE = 5

// The project lists a card can select: panel wording and the empty state.
const PROJECT_VIEWS = {
  [MANAGER_DASHBOARD_VIEWS.active]: {
    title: 'Active projects',
    description: 'Health, milestone completion, logged hours, and budget usage at a glance.',
    empty: { title: 'No active projects', body: 'Projects an admin assigns to you appear here.' },
  },
  [MANAGER_DASHBOARD_VIEWS.endingSoon]: {
    title: 'Approaching end date',
    description: 'Projects ending within the next 60 days.',
    empty: { title: 'Nothing ending soon', body: 'No project ends in the next 60 days.' },
  },
  [MANAGER_DASHBOARD_VIEWS.overBudget]: {
    title: 'Projects over budget',
    description: 'Labor cost has passed the budget, which raises health one step.',
    empty: { title: 'Everything is within budget', body: 'No project has spent more than its budget.' },
  },
}

/**
 * The list for the selected dashboard card: active projects, reviews, projects ending soon
 * or over budget, five at a time. Keyed by view, so switching cards starts at page 1.
 * lists: { active, reviews, endingSoon, overBudget }.
 */
export function DashboardFocusPanel(props) {
  return <FocusPanel key={props.view} {...props} />
}

function FocusPanel({ view, lists, projects, onOpenProject, onReview }) {
  const items = lists[view] ?? lists.active
  const pages = usePagination(items, PAGE_SIZE)
  const pager = items.length > 0 && <Pager {...pages} />

  if (view === MANAGER_DASHBOARD_VIEWS.reviews) {
    return (
      <ReviewQueue
        reviews={pages.pageItems}
        total={items.length}
        footer={pager}
        projects={projects}
        onReview={onReview}
      />
    )
  }
  const { title, description, empty } = PROJECT_VIEWS[view] ?? PROJECT_VIEWS.active
  return (
    <Panel title={title} description={description}>
      {items.length ? (
        <ManagerProjectTable projects={pages.pageItems} onOpen={(project) => onOpenProject(project.id)} compact />
      ) : (
        <EmptyState {...empty} />
      )}
      {pager}
    </Panel>
  )
}
