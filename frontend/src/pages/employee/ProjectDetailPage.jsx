import { useState } from 'react'
import { ProjectStatusBadge } from '../../components/projects/ProjectStatusBadge.jsx'
import { BackLink, DetailHero, Panel, Tabs } from '../../components/ui'
import { WorkLogTable } from '../../components/worklogs/WorkLogTable.jsx'
import { useApiQuery } from '../../hooks/useApiQuery.js'
import { getMilestone } from '../../services/milestonesApi.js'
import { formatDateRange } from '../../utils/format.js'
import { getProjectMilestones } from '../../utils/milestones.js'
import { EMPLOYEE_WORK_LOG_COLUMNS } from './employeeConfig.js'
import { MyMilestoneCard } from './MyMilestoneCard.jsx'
import { MilestonesTab } from './tabs/MilestonesTab.jsx'
import { TeamTab } from './tabs/TeamTab.jsx'
import './ProjectDetailPage.css'

const TABS = ['Milestones', 'Project Team', 'My Work Logs']

/** One of the employee's projects: their milestone card plus tabs. assignment from getAssignments. */
export function ProjectDetailPage({ assignment, milestones, members, logs, onBack, onLog, onReview }) {
  const [tab, setTab] = useState(TABS[0])
  const { project, milestone, state } = assignment
  // The milestone's review history, for the manager's latest feedback.
  const details = useApiQuery(() => (milestone ? getMilestone(milestone.id) : null), [milestone?.id])
  const projectLogs = logs.filter((log) => log.project.id === project.id)

  return (
    <>
      <BackLink onClick={onBack}>Back to my projects</BackLink>
      <DetailHero
        className="employee-project-hero"
        badges={<ProjectStatusBadge status={project.status} />}
        title={project.name}
        subtitle={`Managed by ${project.manager?.name ?? 'nobody yet'} · ${formatDateRange(project.start_date, project.end_date)}`}
      />
      <MyMilestoneCard
        project={project}
        milestone={milestone}
        state={state}
        milestones={milestones}
        logs={logs}
        latestReview={details.data?.reviews[0]}
        onLog={onLog}
        onReview={onReview}
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'Milestones' && (
        <MilestonesTab items={getProjectMilestones(milestones, project.id)} myMilestoneId={milestone?.id} />
      )}
      {tab === 'Project Team' && (
        <TeamTab project={project} members={members.filter((member) => member.project_id === project.id)} />
      )}
      {tab === 'My Work Logs' && (
        <Panel title="My project work logs" description="Earlier milestone entries stay visible after reassignment.">
          <WorkLogTable
            logs={projectLogs}
            columns={EMPLOYEE_WORK_LOG_COLUMNS}
            emptyBody="You haven’t logged work on this project yet."
          />
        </Panel>
      )}
    </>
  )
}
