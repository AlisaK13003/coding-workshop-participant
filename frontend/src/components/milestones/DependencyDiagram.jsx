import { Fragment } from 'react'
import { Check, ChevronRight, CircleAlert, Clock3 } from 'lucide-react'
import { cx } from '../../utils/cx.js'
import {
  MILESTONE_STATUS,
  getDependencyColumns,
  getMilestoneState,
} from '../../utils/milestones.js'
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
 * milestones: [{ id, name, prerequisiteIds, status }] for one project.
 * highlightId (optional): outlines one node and prefixes its state with highlightLabel.
 */
export function DependencyDiagram({
  milestones,
  highlightId,
  highlightLabel = 'Your milestone',
  className,
}) {
  const columns = getDependencyColumns(milestones)
  const renderNode = (milestone) => (
    <DiagramNode
      key={milestone.id}
      milestone={milestone}
      state={getMilestoneState(milestone, milestones)}
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

function DiagramNode({ milestone, state, highlightLabel }) {
  const Icon = NODE_ICON[state] || CircleAlert
  return (
    <div
      className={cx('dependency-node', NODE_CLASS[state], highlightLabel && 'my-node')}
    >
      <Icon size={15} />
      <span>
        {milestone.name}
        <small>
          {highlightLabel && `${highlightLabel} · `}
          {state}
        </small>
      </span>
    </div>
  )
}
