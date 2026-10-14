import { useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'
import { ProjectMilestonesTab } from '../../components/milestones/ProjectMilestonesTab.jsx'
import { CompletionNote } from '../../components/projects/CompletionNote.jsx'
import { ProjectOverviewTab } from '../../components/projects/ProjectOverviewTab.jsx'
import { ProjectPeopleTab } from '../../components/projects/ProjectPeopleTab.jsx'
import { ProjectStatusBadge } from '../../components/projects/ProjectStatusBadge.jsx'
import { ProjectSummaryCards } from '../../components/projects/ProjectSummaryCards.jsx'
import {
  ActionMenu,
  BackLink,
  Badge,
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
import { PROJECT_STATUS, canCompleteProject, getProjectPhase, isOpenProject, needsManager } from '../../utils/projects.js'
import { getAdminWorkLogColumns } from './adminWorkLogColumns.jsx'
import { ActivityTab } from './tabs/ActivityTab.jsx'
import { HealthExplanation } from '../../components/projects/HealthExplanation.jsx'

const TABS = ['Overview', 'Milestones', 'People', 'Work Logs', 'Activity']

/**
 * One project: header, completion note, summary cards and tabbed details.
 * Changes need an open project, so closed ones offer archiving (and reopening, if abandoned).
 */
export function ProjectDetailPage({ project, onBack, onOpenDialog }) {
  const [tab, setTab] = useState(TABS[0])
  const milestones = useApiQuery(() => listMilestones(project.id), [project.id])
  const open = isOpenProject(project)
  const canComplete = canCompleteProject(project)
  const remaining = project.milestones.total - project.milestones.completed
  const openDialog = (kind) => () => onOpenDialog(kind, { project })

  return (
    <>
      <BackLink onClick={onBack}>Back to projects</BackLink>
      <DetailHero
        badges={
          <>
            <ProjectStatusBadge status={project.status} />
            {project.archived_at && <Badge>Archived</Badge>}
            <span>
              <Phase value={getProjectPhase(project)} />{' '}
              <Tooltip label="Why this health?">
                <HealthExplanation project={project} milestones={milestones.data ?? []} />
              </Tooltip>
            </span>
          </>
        }
        title={project.name}
        subtitle={`${project.manager?.name ?? 'No manager'} · ${formatDateRange(project.start_date, project.end_date)}`}
        actions={
          <>
            {open && needsManager(project) && (
              <Button onClick={openDialog(DIALOGS.assignManager)}>
                <UserPlus size={15} />
                Assign manager
              </Button>
            )}
            {open && (
              <Button variant="secondary" onClick={openDialog(DIALOGS.editProject)}>
                Edit project
              </Button>
            )}
            <ActionMenu
              items={[
                open && {
                  label: 'Mark completed',
                  disabled: !canComplete,
                  title: canComplete ? undefined : 'All milestones must be complete first',
                  onClick: openDialog(DIALOGS.completeProject),
                },
                open && { label: 'Mark abandoned', onClick: openDialog(DIALOGS.abandonProject) },
                project.status === PROJECT_STATUS.abandoned && !project.archived_at && {
                  label: 'Reopen project',
                  onClick: openDialog(DIALOGS.reopenProject),
                },
                project.archived_at
                  ? { label: 'Unarchive project', onClick: openDialog(DIALOGS.unarchiveProject) }
                  : {
                      label: 'Archive project',
                      disabled: open,
                      title: open ? 'Mark the project completed or abandoned first' : undefined,
                      onClick: openDialog(DIALOGS.archiveProject),
                    },
              ]}
            />
          </>
        }
      />
      {open && !canComplete && <CompletionNote remaining={remaining} />}
      <ProjectSummaryCards project={project} />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <QueryContent query={milestones} loadingLabel="Loading milestones…">
        {(items) => (
          <>
            {tab === 'Overview' && (
              <ProjectOverviewTab
                project={project}
                milestones={items}
                onEdit={open ? openDialog(DIALOGS.editProject) : undefined}
              />
            )}
            {tab === 'Milestones' && (
              <ProjectMilestonesTab
                project={project}
                milestones={items}
                canManage={open}
                onOpenDialog={onOpenDialog}
              />
            )}
            {tab === 'People' && (
              <ProjectPeopleTab
                project={project}
                milestones={items}
                canManage={open}
                onOpenDialog={onOpenDialog}
              />
            )}
          </>
        )}
      </QueryContent>
      {tab === 'Work Logs' && (
        <ProjectWorkLogsTab
          project={project}
          columns={getAdminWorkLogColumns(onOpenDialog, { withProject: false })}
          description="Historical pay rate and cost are kept on each entry."
          actions={
            <Button onClick={openDialog(DIALOGS.addWorkLog)}>
              <Plus size={16} />
              Add historical entry
            </Button>
          }
        />
      )}
      {tab === 'Activity' && <ActivityTab project={project} />}
    </>
  )
}
