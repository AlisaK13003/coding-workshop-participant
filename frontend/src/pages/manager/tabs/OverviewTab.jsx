import { MilestoneTimeline } from '../../../components/milestones/MilestoneTimeline.jsx'
import { Button, DetailList, Panel, Phase } from '../../../components/ui'
import { MANAGER_NAME } from '../../../data/managerData.js'
import {
  formatDate,
  formatDateRange,
  formatMoney,
} from '../../../utils/format.js'
import { getMilestoneState } from '../../../utils/milestones.js'
import { MANAGER_DIALOGS } from '../managerConfig.js'

/** Editable project facts beside the milestone timeline. items: this project's milestones. */
export function OverviewTab({ project, phase, items, milestones, onOpenDialog }) {
  return (
    <div className="overview-grid">
      <Panel
        title="Project information"
        description="Managers can update project details but not ownership."
        actions={
          <Button
            variant="ghost"
            onClick={() => onOpenDialog(MANAGER_DIALOGS.editProject)}
          >
            Edit
          </Button>
        }
      >
        <DetailList
          items={[
            { label: 'Manager', value: MANAGER_NAME },
            { label: 'Start date', value: formatDate(project.start) },
            { label: 'Predicted end', value: formatDate(project.end) },
            { label: 'Schedule phase', value: <Phase value={phase} /> },
            { label: 'Estimated budget', value: formatMoney(project.budget) },
          ]}
        />
      </Panel>
      <Panel
        title="Milestone timeline"
        description="Parallel and dependent scheduled work."
      >
        <MilestoneTimeline
          milestones={items}
          getState={(milestone) => getMilestoneState(milestone, milestones)}
          getDates={(milestone) => formatDateRange(milestone.start, milestone.end)}
        />
      </Panel>
    </div>
  )
}
