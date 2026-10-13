import { CheckCircle2 } from 'lucide-react'
import { ReviewIcon } from '../../components/milestones/ReviewIcon.jsx'
import { Badge, Button, EmptyState, Panel } from '../../components/ui'
import { getPendingReviews, getProjectName } from './managerSelectors.js'
import './ReviewQueue.css'

/** Milestones waiting for the manager's completion review. */
export function ReviewQueue({ milestones, projects, onReview }) {
  const reviews = getPendingReviews(milestones, projects)
  return (
    <Panel
      title="Milestone review queue"
      description="Requests apply to the entire milestone, not an individual task."
      actions={<Badge tone="Awaiting review">{reviews.length} pending</Badge>}
    >
      {reviews.length ? (
        <div className="review-queue">
          {reviews.map((milestone) => (
            <div key={milestone.id}>
              <ReviewIcon icon={CheckCircle2} />
              <p>
                <strong>{milestone.name}</strong>
                <span>{getProjectName(projects, milestone.projectId)}</span>
              </p>
              <div className="review-requester">
                <span>Requested by</span>
                <strong>{milestone.requester}</strong>
              </div>
              <time>{milestone.requestDate}</time>
              <Button onClick={() => onReview(milestone)}>Review</Button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No reviews waiting"
          body="New milestone completion requests will appear here."
        />
      )}
    </Panel>
  )
}
