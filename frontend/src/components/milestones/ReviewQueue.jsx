import { CheckCircle2 } from 'lucide-react'
import { Badge, Button, EmptyState, Panel } from '../ui'
import { findById } from '../../utils/collections.js'
import { formatDateTime } from '../../utils/format.js'
import { ReviewIcon } from './ReviewIcon.jsx'
import './ReviewQueue.css'

/**
 * Milestones waiting for a completion review (managers and admins). reviews from
 * getPendingReviews; `total` (defaults to reviews.length) and `footer` (e.g. a Pager) support paging.
 */
export function ReviewQueue({ reviews, projects, onReview, total = reviews.length, footer = null }) {
  return (
    <Panel
      title="Milestone review queue"
      description="Requests apply to the entire milestone, not an individual task."
      actions={<Badge tone="Awaiting review">{total} pending</Badge>}
    >
      {reviews.length ? (
        <div className="review-queue">
          {reviews.map((milestone) => (
            <div key={milestone.id}>
              <ReviewIcon icon={CheckCircle2} />
              <p>
                <strong>{milestone.name}</strong>
                <span>{findById(projects, milestone.project_id)?.name}</span>
              </p>
              <div className="review-requester">
                <span>Requested by</span>
                <strong>{milestone.pending_review.requested_by.name}</strong>
              </div>
              <time>{formatDateTime(milestone.pending_review.requested_at)}</time>
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
      {footer}
    </Panel>
  )
}
