import { useState } from 'react'
import { CompletionNote } from '../../components/projects/CompletionNote.jsx'
import { ProjectSummaryCards } from '../../components/projects/ProjectSummaryCards.jsx'
import {
  ActionMenu,
  BackLink,
  Badge,
  Button,
  DetailHero,
  Phase,
  Tabs,
  Tooltip,
} from '../../components/ui'
import { MANAGER_NAME } from '../../data/managerData.js'
import { formatDateRange } from '../../utils/format.js'
import { countCompleted, getProjectMilestones } from '../../utils/milestones.js'
import { MANAGER_DIALOGS } from './managerConfig.js'
import { getProjectPhase } from './managerSelectors.js'
import { MilestonesTab } from './tabs/MilestonesTab.jsx'
import { OverviewTab } from './tabs/OverviewTab.jsx'
import { PeopleTab } from './tabs/PeopleTab.jsx'
import { WorkLogsTab } from './tabs/WorkLogsTab.jsx'

const TABS = ['Overview', 'Milestones', 'People', 'Work Logs']

const SUMMARY_COPY = {
  hoursNote: 'Across visible work entries',
  costLabel: 'Recorded labor cost',
  costNote: 'Historical cost is preserved',
  milestonesLabel: 'Milestone completion',
  milestonesNote: 'Closing the project is explicit',
}

/**
 * One of the manager's projects. onOpenDialog(kind, { milestoneId, employeeId })
 * opens a manager dialog; onEmployeeMilestone(employeeId, milestoneId | null).
 */
export function ProjectDetailPage({
  project,
  milestones,
  employees,
  logs,
  onBack,
  onOpenDialog,
  onEmployeeMilestone,
}) {
  const [tab, setTab] = useState(TABS[0])
  const items = getProjectMilestones(milestones, project.id)
  const remaining = items.length - countCompleted(items)
  const canComplete = remaining === 0
  const phase = getProjectPhase(project)

  return (
    <>
      <BackLink onClick={onBack}>Back to my projects</BackLink>
      <DetailHero
        badges={
          <>
            <Badge tone="In progress">In progress</Badge>
            <span>
              <Phase value={phase} />{' '}
              <Tooltip text="Schedule phase reflects elapsed scheduled time, not delivery performance." />
            </span>
          </>
        }
        title={project.name}
        subtitle={`${formatDateRange(project.start, project.end)} · Managed by ${MANAGER_NAME}`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => onOpenDialog(MANAGER_DIALOGS.editProject)}
            >
              Edit project
            </Button>
            <ActionMenu
              items={[
                {
                  label: 'Mark project complete',
                  disabled: !canComplete,
                  title: canComplete
                    ? undefined
                    : `${remaining} unfinished milestones remain`,
                  onClick: () => onOpenDialog(MANAGER_DIALOGS.completeProject),
                },
                {
                  label: 'Abandon project',
                  onClick: () => onOpenDialog(MANAGER_DIALOGS.abandonProject),
                },
              ]}
            />
          </>
        }
      />
      {!canComplete && (
        <CompletionNote remaining={remaining} itemLabel="unfinished milestone" />
      )}
      <ProjectSummaryCards
        project={project}
        completed={items.length - remaining}
        total={items.length}
        copy={SUMMARY_COPY}
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'Overview' && (
        <OverviewTab
          project={project}
          phase={phase}
          items={items}
          milestones={milestones}
          onOpenDialog={onOpenDialog}
        />
      )}
      {tab === 'Milestones' && (
        <MilestonesTab
          items={items}
          milestones={milestones}
          employees={employees}
          onOpenDialog={onOpenDialog}
        />
      )}
      {tab === 'People' && (
        <PeopleTab
          project={project}
          items={items}
          milestones={milestones}
          employees={employees}
          onOpenDialog={onOpenDialog}
          onEmployeeMilestone={onEmployeeMilestone}
        />
      )}
      {tab === 'Work Logs' && (
        <WorkLogsTab
          project={project}
          logs={logs}
          employees={employees}
          milestones={milestones}
        />
      )}
    </>
  )
}
