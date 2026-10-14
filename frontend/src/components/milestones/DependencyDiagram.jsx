import { Fragment } from 'react'
import { Check, ChevronRight, CircleAlert, Clock3 } from 'lucide-react'
import { cx } from '../../utils/cx.js'
import {
  MILESTONE_STATUS,
  getDependencyColumns,
  milestoneStatusLabel,
} from '../../utils/milestones.js'
import { EmptyState } from '../ui'
import './DependencyDiagram.css'

const NODE_CLASS = {
  [MILESTONE_STATUS.completed]: 'complete',
  [MILESTONE_STATUS.review]: 'review',
  [MILESTONE_STATUS.blocked]: 'blocked',
}

const NODE_ICON = {
  [MILESTONE_STATUS.completed]: Check,
  [MILESTONE_STATUS.review]: Clock3,
}

/**
 * Left-to-right milestone dependency map. Milestones are placed in columns by
 * dependency depth; parallel milestones stack in the same column.
 *
 * milestones: one project's milestones from the API.
 * highlightId (optional): outlines one node and prefixes its state with highlightLabel.
 */
export function DependencyDiagram({
  milestones,
  highlightId,
  highlightLabel = 'Your milestone',
  className,
}) {
  if (!milestones.length) {
    return <EmptyState title="No milestones yet" body="Milestones added to this project appear here." />
  }
  const columns = getDependencyColumns(milestones)
  const renderNode = (milestone) => (
    <DiagramNode
      key={milestone.id}
      milestone={milestone}
      highlightLabel={milestone.id === highlightId ? highlightLabel : null}
    />
  )

  return (
    <div className={cx('dependency-map', className)}>
      {columns.map((column, index) => (
        <Fragment key={column[0].id}>
          {index > 0 && <ChevronRight />}
          {column.length > 1 ? (
            <div className="parallel-stack">{column.map(renderNode)}</div>
          ) : (
            renderNode(column[0])
          )}
        </Fragment>
      ))}
    </div>
  )
}

function DiagramNode({ milestone, highlightLabel }) {
  const Icon = NODE_ICON[milestone.status] || CircleAlert
  return (
    <div
      className={cx('dependency-node', NODE_CLASS[milestone.status], highlightLabel && 'my-node')}
    >
      <Icon size={15} />
      <span>
        {milestone.name}
        <small>
          {highlightLabel && `${highlightLabel} · `}
          {milestoneStatusLabel(milestone.status)}
        </small>
      </span>
    </div>
  )
}
