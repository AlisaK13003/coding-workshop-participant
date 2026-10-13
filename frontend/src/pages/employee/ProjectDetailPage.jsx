import { useState } from 'react'
import { BackLink, Badge, DetailHero, Tabs } from '../../components/ui'
import { TODAY_KEY } from '../../data/employeeData.js'
import { formatDateRange } from '../../utils/format.js'
import { getProjectMilestones } from '../../utils/milestones.js'
import { getAssignmentState, getCurrentMilestone } from './employeeSelectors.js'
import { MyMilestoneCard } from './MyMilestoneCard.jsx'
import { MilestonesTab } from './tabs/MilestonesTab.jsx'
import { TeamTab } from './tabs/TeamTab.jsx'
import { WorkLogsTab } from './tabs/WorkLogsTab.jsx'
import './ProjectDetailPage.css'

const TABS = ['Milestones', 'Project Team', 'My Work Logs']

/** One of the employee's projects: my milestone card plus tabs. */
export function ProjectDetailPage({
  project,
  milestones,
  logs,
  onBack,
  onLog,
  onReview,
}) {
  const [tab, setTab] = useState(TABS[0])
  const milestone = getCurrentMilestone(milestones, project.id)

  return (
    <>
      <BackLink onClick={onBack}>Back to my projects</BackLink>
      <DetailHero
        className="employee-project-hero"
        badges={<Badge tone="In progress">Active project</Badge>}
        title={project.name}
        subtitle={`Managed by ${project.manager} · ${formatDateRange(project.start, project.end)}`}
      />
      <MyMilestoneCard
        milestone={milestone}
        state={getAssignmentState(milestones, project.id)}
        milestones={milestones}
        logs={logs}
        hasLoggedToday={logs.some((log) => log.date === TODAY_KEY)}
        onLog={onLog}
        onReview={onReview}
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'Milestones' && (
        <MilestonesTab
          items={getProjectMilestones(milestones, project.id)}
          milestones={milestones}
          myMilestoneId={milestone?.id}
        />
      )}
      {tab === 'Project Team' && <TeamTab project={project} />}
      {tab === 'My Work Logs' && (
        <WorkLogsTab project={project} logs={logs} milestones={milestones} />
      )}
    </>
  )
}
