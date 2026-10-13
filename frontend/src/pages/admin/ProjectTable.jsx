import { ChevronRight } from 'lucide-react'
import { BudgetUsage } from '../../components/projects/BudgetUsage.jsx'
import { Badge, DataTable, Phase, Tooltip } from '../../components/ui'
import { formatHours, formatMoney, formatRange } from '../../utils/format.js'
import { SCHEDULE_PHASE_HINT } from '../../utils/schedule.js'

/** Admin project list. `compact` (dashboard) merges dates and adds the schedule phase. */
export function ProjectTable({ projects, onOpen, compact = false }) {
  const columns = [
    {
      key: 'name',
      header: 'Project',
      render: (project) => (
        <>
          <strong>{project.name}</strong>
          {project.needsAssignment && (
            <small className="table-note">Needs reassignment</small>
          )}
        </>
      ),
    },
    { key: 'manager', header: 'Manager', render: (project) => project.manager },
    compact
      ? {
          key: 'dates',
          header: 'Date range',
          render: (project) => formatRange(project.start, project.end),
        }
      : { key: 'start', header: 'Start date', render: (project) => project.start },
    !compact && {
      key: 'end',
      header: 'Predicted end',
      render: (project) => project.end,
    },
    {
      key: 'status',
      header: 'Status',
      render: (project) => <Badge tone={project.status}>{project.status}</Badge>,
    },
    compact && {
      key: 'phase',
      header: (
        <>
          Schedule phase <Tooltip text={SCHEDULE_PHASE_HINT} />
        </>
      ),
      render: (project) => <Phase value={project.phase} />,
    },
    {
      key: 'milestones',
      header: 'Milestones',
      render: (project) => project.milestones,
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
      header: 'Budget',
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
