import { countCompleted } from '../../utils/milestones.js'
import { Progress } from '../ui'
import './MilestoneProgress.css'

/** "3 of 5" above a bar. milestones: one project's milestones. */
export function MilestoneProgress({ milestones }) {
  const done = countCompleted(milestones)
  const total = milestones.length
  return (
    <div className="milestone-progress">
      <span>
        {done} of {total}
      </span>
      <Progress value={total ? (done / total) * 100 : 0} />
    </div>
  )
}
