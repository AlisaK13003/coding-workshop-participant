import { Check, Plus } from 'lucide-react'
import { DependencyDiagram } from '../../../components/milestones/DependencyDiagram.jsx'
import { Badge, Button, DataTable, Panel } from '../../../components/ui'
import { findById } from '../../../utils/collections.js'
import {
  formatDateRange,
  formatHours,
  fullName,
} from '../../../utils/format.js'
import {
  MILESTONE_STATUS,
  getMilestoneState,
  getPrerequisiteNames,
} from '../../../utils/milestones.js'
import { MANAGER_DIALOGS } from '../managerConfig.js'

function getAssignedNames(milestone, employees) {
  if (!milestone.employeeIds.length) return 'Unassigned'
  return milestone.employeeIds
    .map((id) => {
      const employee = findById(employees, id)
      return employee ? fullName(employee) : ''
    })
    .join(', ')
}

/** Dependency map and milestone table with review, edit and complete actions. */
export function MilestonesTab({ items, milestones, employees, onOpenDialog }) {
  const stateOf = (milestone) => getMilestoneState(milestone, milestones)
  const openFor = (kind, milestone) =>
    onOpenDialog(kind, { milestoneId: milestone.id })

  const columns = [
    {
      key: 'name',
      header: 'Milestone',
      render: (milestone) => (
        <>
          <strong>{milestone.name}</strong>
          {milestone.requester && (
            <small className="table-note">
              Requested by {milestone.requester}
            </small>
          )}
        </>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (milestone) => formatDateRange(milestone.start, milestone.end),
    },
    {
      key: 'prerequisites',
      header: 'Prerequisites',
      render: (milestone) => getPrerequisiteNames(milestone, milestones),
    },
    {
      key: 'employees',
      header: 'Assigned employees',
      render: (milestone) => getAssignedNames(milestone, employees),
    },
    {
      key: 'hours',
      header: 'Logged',
      render: (milestone) => formatHours(milestone.hours),
    },
    {
      key: 'status',
      header: 'Status',
      render: (milestone) => {
        const state = stateOf(milestone)
        return (
          <>
            <Badge tone={state}>{state}</Badge>
            {state === MILESTONE_STATUS.blocked &&
              milestone.employeeIds.length > 0 && (
                <small className="table-note">Employees waiting</small>
              )}
          </>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      render: (milestone) => {
        const state = stateOf(milestone)
        if (state === MILESTONE_STATUS.review) {
          return (
            <Button onClick={() => openFor(MANAGER_DIALOGS.review, milestone)}>
              Review
            </Button>
          )
        }
        if (state === MILESTONE_STATUS.completed) {
          return (
            <span className="closed-label">
              <Check size={12} /> Closed
            </span>
          )
        }
        return (
          <div className="row-actions">
            <Button
              variant="ghost"
              onClick={() => openFor(MANAGER_DIALOGS.editMilestone, milestone)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                openFor(MANAGER_DIALOGS.completeMilestone, milestone)
              }
            >
              Complete
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <Panel
        title="Dependency map"
        description="A milestone unlocks only when every prerequisite is complete."
        actions={
          <Button onClick={() => onOpenDialog(MANAGER_DIALOGS.addMilestone)}>
            <Plus size={16} />
            Add milestone
          </Button>
        }
      >
        <DependencyDiagram milestones={items} className="manager-map" />
      </Panel>
      <Panel
        title="Milestones"
        description="Completed milestones are permanent and cannot be reopened."
      >
        <DataTable
          columns={columns}
          rows={items}
          getRowKey={(milestone) => milestone.id}
        />
      </Panel>
    </>
  )
}
