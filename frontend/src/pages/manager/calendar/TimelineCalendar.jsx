import { referenceToday } from '../../../data/managerData.js'
import { getYearSpan } from '../../../utils/calendar.js'
import { formatDateRange } from '../../../utils/format.js'
import { getProjectPhase } from '../managerSelectors.js'
import './TimelineCalendar.css'

const YEAR = referenceToday.getFullYear()
const SCALE = ['FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/** One row per project with a bar positioned on the year. */
export function TimelineCalendar({ projects, onOpen }) {
  return (
    <div className="timeline-calendar">
      <div className="timeline-scale">
        {SCALE.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
      {projects.map((project) => {
        const { left, width } = getYearSpan(project.start, project.end, YEAR)
        return (
          <div className="timeline-row" key={project.id}>
            <strong>{project.name}</strong>
            <div>
              <button
                className={`timeline-bar phase-bg-${getProjectPhase(project).toLowerCase()}`}
                style={{ left: `${left}%`, width: `${width}%` }}
                onClick={() => onOpen(project)}
              >
                {formatDateRange(project.start, project.end)}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
