import { DependencyDiagram } from '../../../components/milestones/DependencyDiagram.jsx'
import { MilestoneStatusBadge } from '../../../components/milestones/MilestoneStatusBadge.jsx'
import { DataTable, Panel } from '../../../components/ui'
import { formatDateRange } from '../../../utils/format.js'
import { getPrerequisiteNames } from '../../../utils/milestones.js'
import './MilestonesTab.css'

/** Read-only dependency map and milestone table, highlighting the employee's milestone. */
export function MilestonesTab({ items, myMilestoneId }) {
  const columns = [
    {
      key: 'name',
      header: 'Milestone',
      render: (milestone) => (
        <>
          <strong>{milestone.name}</strong>
          {milestone.id === myMilestoneId && <small className="table-note">Your milestone</small>}
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
      render: (milestone) => getPrerequisiteNames(milestone, items),
    },
    { key: 'status', header: 'Status', render: (milestone) => <MilestoneStatusBadge status={milestone.status} /> },
  ]

  return (
    <>
      <Panel
        title="Milestone dependencies"
        description="Read-only project sequence. You can only log work on your own milestone."
      >
        <DependencyDiagram milestones={items} highlightId={myMilestoneId} />
      </Panel>
      <Panel>
        <DataTable
          columns={columns}
          rows={items}
          getRowKey={(milestone) => milestone.id}
          getRowClassName={(milestone) => (milestone.id === myMilestoneId ? 'my-milestone-row' : undefined)}
        />
      </Panel>
    </>
  )
}
