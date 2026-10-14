import { MilestoneTimeline } from '../milestones/MilestoneTimeline.jsx'
import { Button, DetailList, Panel, Phase } from '../ui'
import { formatDate, formatMoney } from '../../utils/format.js'
import { getProjectPhase } from '../../utils/projects.js'
import { ProjectStatusBadge } from './ProjectStatusBadge.jsx'

/** Project facts beside the milestone timeline. onEdit (optional) adds an Edit button. */
export function ProjectOverviewTab({ project, milestones, onEdit }) {
  return (
    <div className="overview-grid">
      <Panel
        title="Project information"
        description="Core schedule and ownership details."
        actions={
          onEdit && (
            <Button variant="ghost" onClick={onEdit}>
              Edit
            </Button>
          )
        }
      >
        <DetailList
          items={[
            { label: 'Manager', value: project.manager?.name ?? 'Unassigned' },
            { label: 'Start date', value: formatDate(project.start_date) },
            { label: 'Predicted end', value: formatDate(project.end_date) },
            { label: 'Schedule phase', value: <Phase value={getProjectPhase(project)} /> },
            { label: 'Estimated budget', value: formatMoney(project.budget) },
            { label: 'Project status', value: <ProjectStatusBadge status={project.status} /> },
          ]}
        />
      </Panel>
      <Panel title="Milestone timeline" description="Milestone sequence and parallel work.">
        <MilestoneTimeline milestones={milestones} />
      </Panel>
    </div>
  )
}
