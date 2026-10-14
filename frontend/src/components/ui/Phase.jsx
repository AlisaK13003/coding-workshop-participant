import { phaseLabel } from '../../utils/schedule.js'
import './Phase.css'

/** Health dot and label ("On track", …). value: 'Green' | 'Amber' | 'Red'. */
export function Phase({ value }) {
  return (
    <span className="phase">
      <i className={`phase-dot phase-${value.toLowerCase()}`} />
      {phaseLabel(value)}
    </span>
  )
}
