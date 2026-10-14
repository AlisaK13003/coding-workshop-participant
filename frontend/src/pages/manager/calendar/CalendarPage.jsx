import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Button,
  PageHeading,
  Panel,
  SearchBox,
  ViewToggle,
} from '../../../components/ui'
import { addMonths, formatMonthYear } from '../../../utils/calendar.js'
import { includesText } from '../../../utils/text.js'
import { MonthCalendar } from './MonthCalendar.jsx'
import { TimelineCalendar } from './TimelineCalendar.jsx'
import './CalendarPage.css'

/** The first day of the current month, where the calendar opens and "Today" returns. */
function currentMonth() {
  return addMonths(new Date(), 0)
}

const VIEW_OPTIONS = [
  { value: 'month', label: 'Month' },
  { value: 'timeline', label: 'Timeline' },
]

/** Active project deadlines on a month grid, or full date ranges on a year timeline. */
export function CalendarPage({ projects, onOpenProject }) {
  const [cursor, setCursor] = useState(currentMonth)
  const [view, setView] = useState('month')
  const [search, setSearch] = useState('')
  const visible = projects.filter((project) => includesText(project.name, search))
  const openProject = (project) => onOpenProject(project.id)

  return (
    <>
      <PageHeading
        eyebrow="Portfolio schedule"
        title="Calendar"
        description="Month view shows each project on its deadline; the timeline shows full date ranges. Closed and archived projects are excluded."
      />
      <Panel>
        <div className="calendar-toolbar">
          <div className="calendar-nav">
            <Button
              variant="secondary"
              onClick={() => setCursor(currentMonth())}
            >
              Today
            </Button>
            <button
              onClick={() => setCursor(addMonths(cursor, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCursor(addMonths(cursor, 1))}
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
            <strong>{formatMonthYear(cursor)}</strong>
          </div>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Filter projects"
          />
          <ViewToggle options={VIEW_OPTIONS} value={view} onChange={setView} />
        </div>
        <div className="schedule-legend">
          <span>
            <i className="phase-dot phase-green" /> On track · no overdue milestones
          </span>
          <span>
            <i className="phase-dot phase-amber" /> Needs attention · 1 overdue
          </span>
          <span>
            <i className="phase-dot phase-red" /> Urgent · 2+ overdue or past the end date
          </span>
          <small>
            Overdue means past a milestone’s end date and not completed.
          </small>
        </div>
        {view === 'month' ? (
          <MonthCalendar month={cursor} projects={visible} onOpen={openProject} />
        ) : (
          <TimelineCalendar year={cursor.getFullYear()} projects={visible} onOpen={openProject} />
        )}
      </Panel>
    </>
  )
}
