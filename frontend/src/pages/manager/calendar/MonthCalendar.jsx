import { cx } from '../../../utils/cx.js'
import { getMonthGrid, toIsoDate } from '../../../utils/calendar.js'
import { formatDateRange } from '../../../utils/format.js'
import { getProjectPhase } from '../managerSelectors.js'
import './MonthCalendar.css'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Six-week month grid. Each day lists up to three active projects as
 * phase-coloured bars; the name shows on Sundays and on the start day.
 */
export function MonthCalendar({ month, projects, onOpen }) {
  return (
    <div className="month-calendar">
      {WEEKDAYS.map((day) => (
        <span className="calendar-weekday" key={day}>
          {day}
        </span>
      ))}
      {getMonthGrid(month).map((day) => {
        const key = toIsoDate(day)
        const active = projects.filter(
          (project) => project.start <= key && project.end >= key,
        )
        return (
          <div
            className={cx(
              'calendar-day',
              day.getMonth() !== month.getMonth() && 'outside',
            )}
            key={key}
          >
            <span>{day.getDate()}</span>
            <div>
              {active.slice(0, 3).map((project) => (
                <button
                  className={`calendar-bar phase-bg-${getProjectPhase(project).toLowerCase()}`}
                  key={project.id}
                  onClick={() => onOpen(project)}
                  title={`${project.name}: ${formatDateRange(project.start, project.end)}`}
                >
                  {day.getDay() === 0 || project.start === key
                    ? project.name
                    : ''}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
