import { cx } from '../../../utils/cx.js'
import { getMonthGrid, toIsoDate, todayIso } from '../../../utils/calendar.js'
import { formatDate } from '../../../utils/format.js'
import { getProjectPhase } from '../../../utils/projects.js'
import './MonthCalendar.css'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Six-week month grid showing each active project on its deadline (end date)
 * as a phase-coloured label. Days with more than three deadlines show "+N more".
 */
export function MonthCalendar({ month, projects, onOpen }) {
  const today = todayIso()
  return (
    <div className="month-calendar">
      {WEEKDAYS.map((day) => (
        <span className="calendar-weekday" key={day}>
          {day}
        </span>
      ))}
      {getMonthGrid(month).map((day) => {
        const key = toIsoDate(day)
        const due = projects.filter((project) => project.end_date === key)
        return (
          <div
            className={cx(
              'calendar-day',
              day.getMonth() !== month.getMonth() && 'outside',
              key === today && 'today',
            )}
            key={key}
          >
            <span>{day.getDate()}</span>
            <div>
              {due.slice(0, 3).map((project) => (
                <button
                  className={`calendar-bar phase-bg-${getProjectPhase(project).toLowerCase()}`}
                  key={project.id}
                  onClick={() => onOpen(project)}
                  title={`${project.name} is due ${formatDate(project.end_date)}`}
                >
                  {project.name}
                </button>
              ))}
              {due.length > 3 && <small className="calendar-more">+{due.length - 3} more</small>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
