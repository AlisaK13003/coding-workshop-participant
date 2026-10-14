import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Button,
  PageHeading,
  Panel,
  SearchBox,
  ViewToggle,
} from '../ui'
import { addMonths, formatMonthYear } from '../../utils/calendar.js'
import { includesText } from '../../utils/text.js'
import { MonthCalendar } from './MonthCalendar.jsx'
import { TimelineCalendar } from './TimelineCalendar.jsx'
import './ProjectCalendar.css'

/** The first day of the current month, where the calendar opens and "Today" returns. */
function currentMonth() {
  return addMonths(new Date(), 0)
}

const VIEW_OPTIONS = [
  { value: 'month', label: 'Month' },
  { value: 'timeline', label: 'Timeline' },
]

/**
 * Calendar page shared by managers and admins: project deadlines on a month grid, or
 * full date ranges on a year timeline. `filters` adds role-specific controls to the
 * toolbar (e.g. the admin's manager filter); onOpenProject(project) opens one.
 */
export function ProjectCalendar({ projects, onOpenProject, filters = null }) {
  const [cursor, setCursor] = useState(currentMonth)
  const [view, setView] = useState('month')
  const [search, setSearch] = useState('')
  const visible = projects.filter((project) => includesText(project.name, search))
  // The month grid steps a month at a time; the year timeline steps a year.
  const isTimeline = view === 'timeline'
  const step = isTimeline ? 12 : 1
  const unit = isTimeline ? 'year' : 'month'

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
              onClick={() => setCursor(addMonths(cursor, -step))}
              aria-label={`Previous ${unit}`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCursor(addMonths(cursor, step))}
              aria-label={`Next ${unit}`}
            >
              <ChevronRight size={18} />
            </button>
            <strong>{isTimeline ? cursor.getFullYear() : formatMonthYear(cursor)}</strong>
          </div>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Filter projects"
          />
          {filters}
          <ViewToggle options={VIEW_OPTIONS} value={view} onChange={setView} />
        </div>
        <div className="schedule-legend">
          <span>
            <i className="phase-dot phase-green" /> On track · every milestone on schedule
          </span>
          <span>
            <i className="phase-dot phase-amber" /> Needs attention · a milestone is running late
          </span>
          <span>
            <i className="phase-dot phase-red" /> Urgent · several milestones late, or the project is past its end date
          </span>
          <small>
            Late: a milestone past its end date and not completed.
          </small>
        </div>
        {view === 'month' ? (
          <MonthCalendar month={cursor} projects={visible} onOpen={onOpenProject} />
        ) : (
          <TimelineCalendar year={cursor.getFullYear()} projects={visible} onOpen={onOpenProject} />
        )}
      </Panel>
    </>
  )
}
