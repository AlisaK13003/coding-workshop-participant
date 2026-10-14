import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  DollarSign,
} from 'lucide-react'
import { formatHours, formatMoney } from '../../utils/format.js'
import { getBudgetUsage, isOverBudget } from '../../utils/schedule.js'
import { StatCard } from '../ui'

const DEFAULT_COPY = {
  hoursNote: 'Across all work entries',
  costLabel: 'Labor cost',
  costNote: 'Historical recorded cost',
  milestonesLabel: 'Milestones',
  milestonesNote: 'Completion is explicit',
}

/**
 * The five metric cards under a project header: hours, labor cost, budget,
 * remaining budget and milestone completion, all from the project's API totals.
 * copy (optional) overrides labels and notes.
 */
export function ProjectSummaryCards({ project, copy }) {
  const text = { ...DEFAULT_COPY, ...copy }
  const { hours, cost, budget, milestones } = project
  return (
    <div className="summary-grid">
      <StatCard
        label="Logged hours"
        value={formatHours(hours)}
        note={text.hoursNote}
        icon={Clock3}
      />
      <StatCard
        label={text.costLabel}
        value={formatMoney(cost)}
        note={text.costNote}
        icon={DollarSign}
      />
      <StatCard
        label="Budget"
        value={formatMoney(budget)}
        note={`${getBudgetUsage(cost, budget)}% used`}
        icon={BriefcaseBusiness}
      />
      <StatCard
        label="Remaining budget"
        value={formatMoney(budget - cost)}
        note={
          isOverBudget(cost, budget) ? 'Project is over budget' : 'Available estimate'
        }
        icon={DollarSign}
      />
      <StatCard
        label={text.milestonesLabel}
        value={`${milestones.completed} / ${milestones.total}`}
        note={text.milestonesNote}
        icon={CheckCircle2}
      />
    </div>
  )
}
