import { DependencyDiagram } from '../../../components/milestones/DependencyDiagram.jsx'
import { Badge, DataTable, Panel } from '../../../components/ui'
import { formatDateRange } from '../../../utils/format.js'
import {
  getMilestoneState,
  getPrerequisiteNames,
} from '../../../utils/milestones.js'
import './MilestonesTab.css'

/** Read-only dependency map and milestone table, highlighting the employee's milestone. */
export function MilestonesTab({ items, milestones, myMilestoneId }) {
  const columns = [
    {
      key: 'name',
      header: 'Milestone',
      render: (milestone) => (
        <>
          <strong>{milestone.name}</strong>
          {milestone.id === myMilestoneId && (
            <small className="table-note">Your milestone</small>
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
      key: 'status',
      header: 'Status',
      render: (milestone) => {
        const state = getMilestoneState(milestone, milestones)
        return <Badge tone={state}>{state}</Badge>
      },
    },
  ]

  return (
    <>
      <Panel
        title="Milestone dependencies"
        description="Read-only project sequence. Visible milestones are not selectable for work logging."
      >
        <DependencyDiagram milestones={items} highlightId={myMilestoneId} />
      </Panel>
      <Panel>
        <DataTable
          columns={columns}
          rows={items}
          getRowKey={(milestone) => milestone.id}
          getRowClassName={(milestone) =>
            milestone.id === myMilestoneId ? 'my-milestone-row' : undefined
          }
        />
      </Panel>
    </>
  )
}
