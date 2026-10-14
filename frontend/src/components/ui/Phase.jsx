import { phaseLabel } from '../../utils/schedule.js'
import './Phase.css'

/** Health dot and label ("On track", …). value: 'Green' | 'Amber' | 'Red'; title: optional hover reason. */
export function Phase({ value, title }) {
  return (
    <span className="phase" title={title}>
      <i className={`phase-dot phase-${value.toLowerCase()}`} />
      {phaseLabel(value)}
    </span>
  )
}
