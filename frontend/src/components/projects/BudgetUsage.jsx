import { getBudgetUsage } from '../../utils/schedule.js'
import { Progress } from '../ui'
import './BudgetUsage.css'

/** "107%" above a progress bar that turns red when the project is over budget. */
export function BudgetUsage({ cost, budget }) {
  const usage = getBudgetUsage(cost, budget)
  return (
    <div className="budget-cell">
      <span>{usage}%</span>
      <Progress value={usage} danger={usage > 100} />
    </div>
  )
}
