import { ChevronRight } from 'lucide-react'
import { BudgetUsage } from '../../components/projects/BudgetUsage.jsx'
import { MilestoneProgress } from '../../components/projects/MilestoneProgress.jsx'
import { DataTable, Phase, Tooltip } from '../../components/ui'
import { formatDateRange, formatHours, formatMoney } from '../../utils/format.js'
import { getProjectPhase } from '../../utils/projects.js'
import { SCHEDULE_PHASE_HINT } from '../../utils/schedule.js'

/** Manager's project list. `compact` (dashboard) hides employees and labor cost. */
export function ManagerProjectTable({ projects, onOpen, compact = false }) {
  const columns = [
    { key: 'name', header: 'Project', render: (project) => <strong>{project.name}</strong> },
    {
      key: 'dates',
      header: 'Date range',
      render: (project) => formatDateRange(project.start_date, project.end_date),
    },
    {
      key: 'phase',
      header: (
        <>
          Health <Tooltip text={SCHEDULE_PHASE_HINT} />
        </>
      ),
      render: (project) => <Phase value={getProjectPhase(project)} />,
    },
    {
      key: 'milestones',
      header: 'Milestones',
      render: (project) => <MilestoneProgress counts={project.milestones} />,
    },
    !compact && { key: 'employees', header: 'Employees', render: (project) => project.member_count },
    { key: 'hours', header: 'Logged', render: (project) => formatHours(project.hours) },
    !compact && { key: 'cost', header: 'Labor cost', render: (project) => formatMoney(project.cost) },
    {
      key: 'budget',
      header: 'Budget usage',
      render: (project) => <BudgetUsage cost={project.cost} budget={project.budget} />,
    },
    { key: 'open', header: '', render: () => <ChevronRight size={17} /> },
  ].filter(Boolean)

  return (
    <DataTable
      columns={columns}
      rows={projects}
      getRowKey={(project) => project.id}
      onRowClick={onOpen}
    />
  )
}
