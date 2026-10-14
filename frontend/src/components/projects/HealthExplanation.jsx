import { Phase } from '../ui'
import { explainHealth } from '../../utils/healthExplanation.js'
import './HealthExplanation.css'

/** Why a project has its health label, for the "?" beside it. milestones names late ones. */
export function HealthExplanation({ project, milestones = [] }) {
  const { phase, headline, reasons, notes } = explainHealth(project, milestones)
  return (
    <span className="health-explanation">
      <span className="health-explanation-head">
        <Phase value={phase} />
        <strong>{headline}</strong>
      </span>
      {reasons.map((reason) => (
        <span key={reason} className="health-explanation-line">{reason}</span>
      ))}
      {notes.length > 0 && (
        <>
          <span className="health-explanation-label">Also worth knowing</span>
          {notes.map((note) => (
            <span key={note} className="health-explanation-line">{note}</span>
          ))}
        </>
      )}
      <span className="health-explanation-foot">
        Health compares each milestone with its own end date; budget doesn’t change the label.
      </span>
    </span>
  )
}
