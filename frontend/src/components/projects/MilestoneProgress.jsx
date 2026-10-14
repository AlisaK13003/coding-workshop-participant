import { Progress } from '../ui'
import './MilestoneProgress.css'

/** "3 of 5" above a bar. counts: a project's { completed, total } from the API. */
export function MilestoneProgress({ counts }) {
  const { completed, total } = counts
  return (
    <div className="milestone-progress">
      <span>
        {completed} of {total}
      </span>
      <Progress value={total ? (completed / total) * 100 : 0} />
    </div>
  )
}
