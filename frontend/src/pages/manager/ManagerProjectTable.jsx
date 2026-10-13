import { ChevronRight } from 'lucide-react'
import { BudgetUsage } from '../../components/projects/BudgetUsage.jsx'
import { MilestoneProgress } from '../../components/projects/MilestoneProgress.jsx'
import { DataTable, Phase, Tooltip } from '../../components/ui'
import { formatDateRange, formatHours, formatMoney } from '../../utils/format.js'
import { getProjectMilestones } from '../../utils/milestones.js'
import { SCHEDULE_PHASE_TABLE_HINT } from './managerConfig.js'
import { getProjectPhase } from './managerSelectors.js'

/** Manager's project list. `compact` (dashboard) hides employees and labor cost. */
export function ManagerProjectTable({ projects, milestones, onOpen, compact = false }) {
  const columns = [
    {
      key: 'name',
      header: 'Project',
      render: (project) => <strong>{project.name}</strong>,
    },
    {
      key: 'dates',
      header: 'Date range',
      render: (project) => formatDateRange(project.start, project.end),
    },
    {
      key: 'phase',
      header: (
        <>
          Schedule phase <Tooltip text={SCHEDULE_PHASE_TABLE_HINT} />
        </>
      ),
      render: (project) => <Phase value={getProjectPhase(project)} />,
    },
    {
      key: 'milestones',
      header: 'Milestones',
      render: (project) => (
        <MilestoneProgress
          milestones={getProjectMilestones(milestones, project.id)}
        />
      ),
    },
    !compact && {
      key: 'employees',
      header: 'Employees',
      render: (project) => project.employeeIds.length,
    },
    {
      key: 'hours',
      header: 'Logged',
      render: (project) => formatHours(project.hours),
    },
    !compact && {
      key: 'cost',
      header: 'Labor cost',
      render: (project) => formatMoney(project.cost),
    },
    {
      key: 'budget',
      header: 'Budget usage',
      render: (project) => (
        <BudgetUsage cost={project.cost} budget={project.budget} />
      ),
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
