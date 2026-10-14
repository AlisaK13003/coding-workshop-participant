import { getYearSpan } from '../../utils/calendar.js'
import { formatDateRange } from '../../utils/format.js'
import { getProjectPhase } from '../../utils/projects.js'
import './TimelineCalendar.css'

const SCALE = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/** One row per project with a bar positioned on `year` (clipped to it). */
export function TimelineCalendar({ year, projects, onOpen }) {
  const inYear = projects.filter(
    (project) => project.start_date <= `${year}-12-31` && project.end_date >= `${year}-01-01`,
  )
  return (
    <div className="timeline-calendar">
      <div className="timeline-scale">
        {SCALE.map((month) => (
          <span key={month}>
            {month} {month === 'JAN' && year}
          </span>
        ))}
      </div>
      {inYear.map((project) => {
        const { left, width } = getYearSpan(project.start_date, project.end_date, year)
        return (
          <div className="timeline-row" key={project.id}>
            <strong>{project.name}</strong>
            <div>
              <button
                className={`timeline-bar phase-bg-${getProjectPhase(project).toLowerCase()}`}
                style={{ left: `${left}%`, width: `${width}%` }}
                onClick={() => onOpen(project)}
                title={formatDateRange(project.start_date, project.end_date)}
              >
                {formatDateRange(project.start_date, project.end_date)}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
