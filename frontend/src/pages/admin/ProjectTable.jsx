import { ChevronRight } from 'lucide-react'
import { BudgetUsage } from '../../components/projects/BudgetUsage.jsx'
import { MilestoneProgress } from '../../components/projects/MilestoneProgress.jsx'
import { ProjectStatusBadge } from '../../components/projects/ProjectStatusBadge.jsx'
import { DataTable, Phase, Tooltip } from '../../components/ui'
import { formatDate, formatDateRange, formatHours, formatMoney } from '../../utils/format.js'
import { getProjectPhase, needsManager } from '../../utils/projects.js'
import { SCHEDULE_PHASE_HINT } from '../../utils/schedule.js'

/**
 * Admin project list. `compact` (dashboard) merges dates and adds the schedule phase.
 * `rowAction(project)` puts a control (e.g. an "Assign manager" button) at the end of each
 * row instead of the arrow; clicking it doesn't also open the project. `hideManager` drops the
 * Manager column, e.g. for a list of projects that have none.
 */
export function ProjectTable({ projects, onOpen, compact = false, rowAction, hideManager = false }) {
  const columns = [
    {
      key: 'name',
      header: 'Project',
      render: (project) => (
        <>
          <strong>{project.name}</strong>
          {needsManager(project) && <small className="table-note">Needs a manager</small>}
        </>
      ),
    },
    !hideManager && { key: 'manager', header: 'Manager', render: (project) => project.manager?.name ?? 'Unassigned' },
    compact
      ? {
          key: 'dates',
          header: 'Date range',
          render: (project) => formatDateRange(project.start_date, project.end_date),
        }
      : { key: 'start', header: 'Start date', render: (project) => formatDate(project.start_date) },
    !compact && {
      key: 'end',
      header: 'Predicted end',
      render: (project) => formatDate(project.end_date),
    },
    {
      key: 'status',
      header: 'Status',
      render: (project) => <ProjectStatusBadge status={project.status} />,
    },
    compact && {
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
    { key: 'hours', header: 'Logged', render: (project) => formatHours(project.hours) },
    !compact && {
      key: 'cost',
      header: 'Labor cost',
      render: (project) => formatMoney(project.cost),
    },
    {
      key: 'budget',
      header: 'Budget',
      render: (project) => <BudgetUsage cost={project.cost} budget={project.budget} />,
    },
    {
      key: 'open',
      header: '',
      render: (project) =>
        rowAction ? (
          <span className="row-action" onClick={(event) => event.stopPropagation()}>
            {rowAction(project)}
          </span>
        ) : (
          <ChevronRight size={17} />
        ),
    },
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
