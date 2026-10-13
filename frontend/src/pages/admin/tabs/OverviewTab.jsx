import { MilestoneTimeline } from '../../../components/milestones/MilestoneTimeline.jsx'
import { Badge, DetailList, Panel, Phase } from '../../../components/ui'
import { formatMoney } from '../../../utils/format.js'

/** Project facts beside the milestone timeline. */
export function OverviewTab({ project, milestones }) {
  return (
    <div className="overview-grid">
      <Panel
        title="Project information"
        description="Core schedule and ownership details."
      >
        <DetailList
          items={[
            { label: 'Manager', value: project.manager },
            { label: 'Start date', value: project.start },
            { label: 'Predicted end', value: project.end },
            { label: 'Schedule phase', value: <Phase value={project.phase} /> },
            { label: 'Estimated budget', value: formatMoney(project.budget) },
            {
              label: 'Project status',
              value: <Badge tone={project.status}>{project.status}</Badge>,
            },
          ]}
        />
      </Panel>
      <Panel
        title="Scheduled timeline"
        description="Milestone sequence and parallel work."
      >
        <MilestoneTimeline milestones={milestones} />
      </Panel>
    </div>
  )
}
