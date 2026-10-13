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
import { includesText } from '../../utils/text.js'
import { getProjectPhase } from './managerSelectors.js'
import { ManagerProjectTable } from './ManagerProjectTable.jsx'
import { ProjectCardGrid } from './ProjectCardGrid.jsx'

const ALL_PHASES = 'All phases'

const VIEW_OPTIONS = [
  { value: 'table', icon: List, ariaLabel: 'Table view' },
  { value: 'cards', icon: GanttChart, ariaLabel: 'Card view' },
]

/** The manager's active projects as a table or cards, with search and date filters. */
export function MyProjectsPage({ projects, milestones, onOpenProject }) {
  const [search, setSearch] = useState('')
  const [phase, setPhase] = useState(ALL_PHASES)
  const [startsAfter, setStartsAfter] = useState('')
  const [endsBefore, setEndsBefore] = useState('')
  const [view, setView] = useState('table')
  const visible = projects.filter(
    (project) =>
      includesText(project.name, search) &&
      (phase === ALL_PHASES || getProjectPhase(project) === phase) &&
      (!startsAfter || project.start >= startsAfter) &&
      (!endsBefore || project.end <= endsBefore),
  )
  const openProject = (project) => onOpenProject(project.id)

  return (
    <>
      <PageHeading
        eyebrow="Your portfolio"
        title="My projects"
        description="Active projects assigned to you. Closed and archived projects are not available here."
        actions={
          <ViewToggle options={VIEW_OPTIONS} value={view} onChange={setView} />
        }
      />
      <Panel>
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search your active projects"
          />
          <div className="filters">
            <Select value={phase} onChange={setPhase}>
              <option>{ALL_PHASES}</option>
              <option>Green</option>
              <option>Amber</option>
              <option>Red</option>
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
            body="Try clearing the search or schedule-phase filter."
          />
        ) : view === 'table' ? (
          <ManagerProjectTable
            projects={visible}
            milestones={milestones}
            onOpen={openProject}
          />
        ) : (
          <ProjectCardGrid
            projects={visible}
            milestones={milestones}
            onOpen={openProject}
          />
        )}
      </Panel>
    </>
  )
}
