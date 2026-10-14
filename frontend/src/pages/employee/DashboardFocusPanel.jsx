import { ChevronRight, Clock3 } from 'lucide-react'
import { ReviewIcon } from '../../components/milestones/ReviewIcon.jsx'
import { Badge, EmptyState, Panel, ViewAllButton } from '../../components/ui'
import { WorkLogTable } from '../../components/worklogs/WorkLogTable.jsx'
import { AssignmentCards } from './AssignmentCards.jsx'
import { EMPLOYEE_DASHBOARD_VIEWS, EMPLOYEE_PAGES, EMPLOYEE_WORK_LOG_COLUMNS } from './employeeConfig.js'

/**
 * The list for the selected dashboard card: assignments, this week's work logs or
 * pending reviews. assignments from getAssignments; reviews are assignments awaiting review.
 */
export function DashboardFocusPanel({ view, assignments, weekLogs, logs, reviews, onOpenProject, onReview, onNavigate }) {
  switch (view) {
    case EMPLOYEE_DASHBOARD_VIEWS.hours:
      return (
        <Panel
          title="This week’s work"
          description="Monday to today, visible projects only."
          actions={<ViewAllButton onClick={() => onNavigate(EMPLOYEE_PAGES.workLogs)} />}
        >
          <WorkLogTable
            logs={weekLogs}
            columns={EMPLOYEE_WORK_LOG_COLUMNS}
            emptyBody="Nothing logged yet this week."
          />
        </Panel>
      )
    case EMPLOYEE_DASHBOARD_VIEWS.reviews:
      return (
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
      )
    default:
      return (
        <Panel title="My project and milestone assignments" description="One current milestone per project.">
          {assignments.length ? (
            <AssignmentCards assignments={assignments} logs={logs} onOpen={onOpenProject} onReview={onReview} />
          ) : (
            <EmptyState title="No active projects" body="Your manager adds you to projects." />
          )}
        </Panel>
      )
  }
}
