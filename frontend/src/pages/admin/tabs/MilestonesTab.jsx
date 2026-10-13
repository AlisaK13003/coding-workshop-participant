import { Plus } from 'lucide-react'
import { DependencyDiagram } from '../../../components/milestones/DependencyDiagram.jsx'
import { Badge, Button, DataTable, Panel } from '../../../components/ui'
import { formatHours } from '../../../utils/format.js'
import {
  MILESTONE_STATUS,
  getPrerequisiteNames,
} from '../../../utils/milestones.js'
import { ADMIN_DIALOGS } from '../adminConfig.js'

/** Dependency map plus the milestone table with review and edit actions. */
export function MilestonesTab({ milestones, onOpenDialog }) {
  const columns = [
    {
      key: 'name',
      header: 'Milestone',
      render: (milestone) => <strong>{milestone.name}</strong>,
    },
    { key: 'dates', header: 'Dates', render: (milestone) => milestone.dates },
    {
      key: 'prerequisites',
      header: 'Prerequisites',
      render: (milestone) => getPrerequisiteNames(milestone, milestones),
    },
    {
      key: 'people',
      header: 'Assigned employees',
      render: (milestone) => milestone.people,
    },
    {
      key: 'hours',
      header: 'Logged',
      render: (milestone) => formatHours(milestone.hours),
    },
    {
      key: 'status',
      header: 'Status',
      render: (milestone) => (
        <>
          <Badge tone={milestone.status}>{milestone.status}</Badge>
          {milestone.status === MILESTONE_STATUS.blocked &&
            milestone.people !== 'Unassigned' && (
              <small className="table-note">Employees waiting</small>
            )}
        </>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (milestone) => {
        if (milestone.status === MILESTONE_STATUS.review) {
          return (
            <Button
              onClick={() => onOpenDialog(ADMIN_DIALOGS.completeMilestone)}
            >
              Review
            </Button>
          )
        }
        if (milestone.status !== MILESTONE_STATUS.completed) {
          return <Button variant="ghost">Edit</Button>
        }
        return null
      },
    },
  ]

  return (
    <>
      <Panel
        title="Dependency map"
        description="Milestones unlock only when all prerequisite branches are complete."
        actions={
          <Button onClick={() => onOpenDialog(ADMIN_DIALOGS.addMilestone)}>
            <Plus size={16} />
            Add milestone
          </Button>
        }
      >
        <DependencyDiagram milestones={milestones} />
      </Panel>
      <Panel
        title="Milestones"
        description="Completed milestones stay closed and cannot be reopened."
      >
        <DataTable
          columns={columns}
          rows={milestones}
          getRowKey={(milestone) => milestone.id}
        />
      </Panel>
    </>
  )
}
