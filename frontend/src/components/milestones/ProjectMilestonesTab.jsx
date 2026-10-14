import { Check, Plus } from 'lucide-react'
import { Button, DataTable, EmptyState, Panel } from '../ui'
import { DIALOGS } from '../workspace/dialogKinds.js'
import { formatDateRange, formatHours } from '../../utils/format.js'
import {
  MILESTONE_STATUS,
  getMemberNames,
  getPrerequisiteNames,
} from '../../utils/milestones.js'
import { DependencyDiagram } from './DependencyDiagram.jsx'
import { MilestoneStatusBadge } from './MilestoneStatusBadge.jsx'

/**
 * Dependency map and milestone table for admins and managers. With canManage
 * (an open project the user manages) it adds add, edit, delete, complete and review actions.
 */
export function ProjectMilestonesTab({ project, milestones, canManage, onOpenDialog }) {
  const open = (kind, milestone) => onOpenDialog(kind, { project, milestone })

  const renderActions = (milestone) => {
    if (milestone.status === MILESTONE_STATUS.completed) {
      return (
        <span className="closed-label">
          <Check size={12} /> Closed
        </span>
      )
    }
    if (!canManage) return null
    if (milestone.pending_review) {
      return <Button onClick={() => open(DIALOGS.reviewMilestone, milestone)}>Review</Button>
    }
    return (
      <div className="row-actions">
        <Button variant="ghost" onClick={() => open(DIALOGS.editMilestone, milestone)}>
          Edit
        </Button>
        <Button variant="ghost" onClick={() => open(DIALOGS.completeMilestone, milestone)}>
          Complete
        </Button>
        <Button variant="ghost" onClick={() => open(DIALOGS.deleteMilestone, milestone)}>
          Delete
        </Button>
      </div>
    )
  }

  const columns = [
    {
      key: 'name',
      header: 'Milestone',
      render: (milestone) => (
        <>
          <strong>{milestone.name}</strong>
          {milestone.pending_review && (
            <small className="table-note">
              Review requested by {milestone.pending_review.requested_by.name}
            </small>
          )}
        </>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (milestone) => formatDateRange(milestone.start_date, milestone.end_date),
    },
    {
      key: 'prerequisites',
      header: 'Prerequisites',
      render: (milestone) => getPrerequisiteNames(milestone, milestones),
    },
    { key: 'members', header: 'Assigned employees', render: getMemberNames },
    { key: 'hours', header: 'Logged', render: (milestone) => formatHours(milestone.hours) },
    {
      key: 'status',
      header: 'Status',
      render: (milestone) => (
        <>
          <MilestoneStatusBadge status={milestone.status} />
          {milestone.status === MILESTONE_STATUS.blocked && milestone.members.length > 0 && (
            <small className="table-note">Employees waiting</small>
          )}
        </>
      ),
    },
    { key: 'actions', header: '', render: renderActions },
  ]

  return (
    <>
      <Panel
        title="Dependency map"
        description="A milestone unlocks only when every prerequisite is complete."
        actions={
          canManage && (
            <Button onClick={() => onOpenDialog(DIALOGS.addMilestone, { project })}>
              <Plus size={16} />
              Add milestone
            </Button>
          )
        }
      >
        <DependencyDiagram milestones={milestones} className="manager-map" />
      </Panel>
      <Panel title="Milestones" description="Completed milestones are permanent and can’t be reopened.">
        {milestones.length ? (
          <DataTable columns={columns} rows={milestones} getRowKey={(milestone) => milestone.id} />
        ) : (
          <EmptyState title="No milestones yet" body="Add the first milestone to plan this project." />
        )}
      </Panel>
    </>
  )
}
