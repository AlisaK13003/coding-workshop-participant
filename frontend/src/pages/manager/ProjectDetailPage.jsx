import { useState } from 'react'
import { ProjectMilestonesTab } from '../../components/milestones/ProjectMilestonesTab.jsx'
import { CompletionNote } from '../../components/projects/CompletionNote.jsx'
import { ProjectOverviewTab } from '../../components/projects/ProjectOverviewTab.jsx'
import { ProjectPeopleTab } from '../../components/projects/ProjectPeopleTab.jsx'
import { ProjectStatusBadge } from '../../components/projects/ProjectStatusBadge.jsx'
import { ProjectSummaryCards } from '../../components/projects/ProjectSummaryCards.jsx'
import {
  ActionMenu,
  BackLink,
  Button,
  DetailHero,
  Phase,
  QueryContent,
  Tabs,
  Tooltip,
} from '../../components/ui'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'
import { ProjectWorkLogsTab } from '../../components/worklogs/ProjectWorkLogsTab.jsx'
import { useApiQuery } from '../../hooks/useApiQuery.js'
import { listMilestones } from '../../services/milestonesApi.js'
import { formatDateRange } from '../../utils/format.js'
import { SCHEDULE_PHASE_HINT } from '../../utils/schedule.js'
import { canCompleteProject, getProjectPhase } from '../../utils/projects.js'
import { pluralize } from '../../utils/text.js'
import { MANAGER_WORK_LOG_COLUMNS } from './managerConfig.js'

const TABS = ['Overview', 'Milestones', 'People', 'Work Logs']

const SUMMARY_COPY = {
  hoursNote: 'Across all work entries',
  costLabel: 'Recorded labor cost',
  costNote: 'Historical cost is preserved',
  milestonesLabel: 'Milestone completion',
  milestonesNote: 'Closing the project is explicit',
}

/**
 * One of the manager's projects (always open: managers only see projects in progress).
 * Managers can complete a project once every milestone is done, but only admins abandon one.
 */
export function ProjectDetailPage({ project, onBack, onOpenDialog }) {
  const [tab, setTab] = useState(TABS[0])
  const milestones = useApiQuery(() => listMilestones(project.id), [project.id])
  const canComplete = canCompleteProject(project)
  const remaining = project.milestones.total - project.milestones.completed
  const openDialog = (kind) => () => onOpenDialog(kind, { project })

  return (
    <>
      <BackLink onClick={onBack}>Back to my projects</BackLink>
      <DetailHero
        badges={
          <>
            <ProjectStatusBadge status={project.status} />
            <span>
              <Phase value={getProjectPhase(project)} />{' '}
              <Tooltip text={SCHEDULE_PHASE_HINT} />
            </span>
          </>
        }
        title={project.name}
        subtitle={`${formatDateRange(project.start_date, project.end_date)} · Managed by ${project.manager.name}`}
        actions={
          <>
            <Button variant="secondary" onClick={openDialog(DIALOGS.editProject)}>
              Edit project
            </Button>
            <ActionMenu
              items={[
                {
                  label: 'Mark project complete',
                  disabled: !canComplete,
                  title: canComplete
                    ? undefined
                    : `${remaining} unfinished ${pluralize(remaining, 'milestone')} remain`,
                  onClick: openDialog(DIALOGS.completeProject),
                },
              ]}
            />
          </>
        }
      />
      {!canComplete && <CompletionNote remaining={remaining} itemLabel="unfinished milestone" />}
      <ProjectSummaryCards project={project} copy={SUMMARY_COPY} />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'Work Logs' ? (
        <ProjectWorkLogsTab
          project={project}
          columns={MANAGER_WORK_LOG_COLUMNS}
          description="Read-only. Admins handle corrections and historical entries."
        />
      ) : (
        <QueryContent query={milestones} loadingLabel="Loading milestones…">
          {(items) => (
            <>
              {tab === 'Overview' && (
                <ProjectOverviewTab project={project} milestones={items} onEdit={openDialog(DIALOGS.editProject)} />
              )}
              {tab === 'Milestones' && (
                <ProjectMilestonesTab project={project} milestones={items} canManage onOpenDialog={onOpenDialog} />
              )}
              {tab === 'People' && (
                <ProjectPeopleTab project={project} milestones={items} canManage onOpenDialog={onOpenDialog} />
              )}
            </>
          )}
        </QueryContent>
      )}
    </>
  )
}
