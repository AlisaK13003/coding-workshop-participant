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
import { parseDate } from '../../../utils/format.js'
import { includesText } from '../../../utils/text.js'
import { MonthCalendar } from './MonthCalendar.jsx'
import { TimelineCalendar } from './TimelineCalendar.jsx'
import './CalendarPage.css'

/** The month the calendar opens on and returns to with "Today". */
const START_MONTH = '2025-06-01'

const VIEW_OPTIONS = [
  { value: 'month', label: 'Month' },
  { value: 'timeline', label: 'Timeline' },
]

/** Active project date ranges as a month grid or a year timeline. */
export function CalendarPage({ projects, onOpenProject }) {
  const [cursor, setCursor] = useState(() => parseDate(START_MONTH))
  const [view, setView] = useState('month')
  const [search, setSearch] = useState('')
  const visible = projects.filter((project) => includesText(project.name, search))
  const openProject = (project) => onOpenProject(project.id)

  return (
    <>
      <PageHeading
        eyebrow="Portfolio schedule"
        title="Calendar"
        description="Active project ranges and overlaps. Closed and archived projects are excluded."
      />
      <Panel>
        <div className="calendar-toolbar">
          <div className="calendar-nav">
            <Button
              variant="secondary"
              onClick={() => setCursor(parseDate(START_MONTH))}
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
            <i className="phase-dot phase-green" /> Green · under 50%
          </span>
          <span>
            <i className="phase-dot phase-amber" /> Amber · 50–75%
          </span>
          <span>
            <i className="phase-dot phase-red" /> Red · 75% or more
          </span>
          <small>
            Schedule phase reflects elapsed scheduled time, not performance.
          </small>
        </div>
        {view === 'month' ? (
          <MonthCalendar month={cursor} projects={visible} onOpen={openProject} />
        ) : (
          <TimelineCalendar projects={visible} onOpen={openProject} />
        )}
      </Panel>
    </>
  )
}
