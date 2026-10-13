import { useState } from 'react'
import { ProjectSummaryCards } from '../../components/projects/ProjectSummaryCards.jsx'
import { CompletionNote } from '../../components/projects/CompletionNote.jsx'
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
import { countCompleted } from '../../utils/milestones.js'
import { ADMIN_DIALOGS } from './adminConfig.js'
import { ActivityTab } from './tabs/ActivityTab.jsx'
import { MilestonesTab } from './tabs/MilestonesTab.jsx'
import { OverviewTab } from './tabs/OverviewTab.jsx'
import { PeopleTab } from './tabs/PeopleTab.jsx'
import { WorkLogsTab } from './tabs/WorkLogsTab.jsx'

const TABS = ['Overview', 'Milestones', 'People', 'Work Logs', 'Activity']

/** One project: header, completion note, summary cards and tabbed details. */
export function ProjectDetailPage({
  project,
  milestones,
  workLogs,
  onBack,
  onOpenDialog,
}) {
  const [tab, setTab] = useState(TABS[0])
  const completed = countCompleted(milestones)
  const remaining = milestones.length - completed
  const canComplete = remaining === 0

  return (
    <>
      <BackLink onClick={onBack}>Back to projects</BackLink>
      <DetailHero
        badges={
          <>
            <Badge tone={project.status}>{project.status}</Badge>
            {project.archived && <Badge>Archived</Badge>}
            <span>
              <Phase value={project.phase} />{' '}
              <Tooltip text="Schedule phase reflects elapsed scheduled time, not performance or budget." />
            </span>
          </>
        }
        title={project.name}
        subtitle={`${project.manager} · ${project.start} – ${project.end}`}
        actions={
          <>
            <Button variant="secondary">Edit project</Button>
            <ActionMenu
              items={[
                {
                  label: 'Mark completed',
                  disabled: !canComplete,
                  title: canComplete
                    ? undefined
                    : 'All milestones must be complete first',
                },
                { label: 'Mark abandoned' },
                {
                  label: 'Archive project',
                  onClick: () => onOpenDialog(ADMIN_DIALOGS.archiveProject),
                },
              ]}
            />
          </>
        }
      />
      {!canComplete && <CompletionNote remaining={remaining} />}
      <ProjectSummaryCards
        project={project}
        completed={completed}
        total={milestones.length}
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'Overview' && (
        <OverviewTab project={project} milestones={milestones} />
      )}
      {tab === 'Milestones' && (
        <MilestonesTab milestones={milestones} onOpenDialog={onOpenDialog} />
      )}
      {tab === 'People' && <PeopleTab />}
      {tab === 'Work Logs' && (
        <WorkLogsTab
          project={project}
          workLogs={workLogs}
          onOpenDialog={onOpenDialog}
        />
      )}
      {tab === 'Activity' && <ActivityTab />}
    </>
  )
}
