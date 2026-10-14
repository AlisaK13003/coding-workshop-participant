import { useState } from 'react'
import { GanttChart, List } from 'lucide-react'
import {
  EmptyState,
  Input,
  PageHeading,
  Panel,
  SearchBox,
  Select,
  ViewToggle,
} from '../../components/ui'
import { getProjectPhase } from '../../utils/projects.js'
import { SCHEDULE_PHASES } from '../../utils/schedule.js'
import { includesText } from '../../utils/text.js'
import { ManagerProjectTable } from './ManagerProjectTable.jsx'
import { ProjectCardGrid } from './ProjectCardGrid.jsx'

const VIEW_OPTIONS = [
  { value: 'table', icon: List, ariaLabel: 'Table view' },
  { value: 'cards', icon: GanttChart, ariaLabel: 'Card view' },
]

/** The manager's active projects as a table or cards, with search and date filters. */
export function MyProjectsPage({ projects, onOpenProject }) {
  const [search, setSearch] = useState('')
  const [phase, setPhase] = useState('')
  const [startsAfter, setStartsAfter] = useState('')
  const [endsBefore, setEndsBefore] = useState('')
  const [view, setView] = useState('table')
  const visible = projects.filter(
    (project) =>
      includesText(project.name, search) &&
      (!phase || getProjectPhase(project) === phase) &&
      (!startsAfter || project.start_date >= startsAfter) &&
      (!endsBefore || project.end_date <= endsBefore),
  )
  const openProject = (project) => onOpenProject(project.id)

  return (
    <>
      <PageHeading
        eyebrow="Your portfolio"
        title="My projects"
        description="Active projects assigned to you. Closed and archived projects aren’t available here."
        actions={<ViewToggle options={VIEW_OPTIONS} value={view} onChange={setView} />}
      />
      <Panel>
        <div className="toolbar">
          <SearchBox value={search} onChange={setSearch} placeholder="Search your active projects" />
          <div className="filters">
            <Select value={phase} onChange={setPhase} aria-label="Schedule phase">
              <option value="">All phases</option>
              {SCHEDULE_PHASES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Select>
            <Input
              type="date"
              value={startsAfter}
              onChange={(event) => setStartsAfter(event.target.value)}
              aria-label="Starts after"
            />
            <Input
              type="date"
              value={endsBefore}
              onChange={(event) => setEndsBefore(event.target.value)}
              aria-label="Ends before"
            />
          </div>
        </div>
        {!visible.length ? (
          <EmptyState
            title="No active projects found"
            body="Try clearing the search or filters. New projects are assigned to you by an admin."
          />
        ) : view === 'table' ? (
          <ManagerProjectTable projects={visible} onOpen={openProject} />
        ) : (
          <ProjectCardGrid projects={visible} onOpen={openProject} />
        )}
      </Panel>
    </>
  )
}
