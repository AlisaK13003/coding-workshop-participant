import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Button,
  EmptyState,
  PageHeading,
  Panel,
  SearchBox,
  Select,
} from '../../components/ui'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'
import { uniqueBy } from '../../utils/collections.js'
import { PROJECT_STATUS, getProjectPhase, isNotArchived, projectStatusLabel } from '../../utils/projects.js'
import { SCHEDULE_PHASES, phaseLabel } from '../../utils/schedule.js'
import { includesText } from '../../utils/text.js'
import { ProjectTable } from './ProjectTable.jsx'

const ALL = ''
const UNASSIGNED = 'unassigned'

function matchesManager(project, manager) {
  if (manager === ALL) return true
  if (manager === UNASSIGNED) return !project.manager
  return String(project.manager?.id) === manager
}

/** Searchable, filterable list of every non-archived project. */
export function ProjectsPage({ projects, onOpenProject, onOpenDialog }) {
  const [search, setSearch] = useState('')
  const [manager, setManager] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [phase, setPhase] = useState(ALL)
  const current = projects.filter(isNotArchived)
  const managers = uniqueBy(
    current.map((project) => project.manager).filter(Boolean),
    (item) => item.id,
  )
  const visible = current.filter(
    (project) =>
      includesText(project.name, search) &&
      matchesManager(project, manager) &&
      (status === ALL || project.status === status) &&
      (phase === ALL || getProjectPhase(project) === phase),
  )

  return (
    <>
      <PageHeading
        eyebrow="Portfolio"
        title="Projects"
        description="Create projects, manage assignments, and monitor delivery health."
        actions={
          <Button onClick={() => onOpenDialog(DIALOGS.createProject)}>
            <Plus size={16} />
            Create project
          </Button>
        }
      />
      <Panel>
        <div className="toolbar">
          <SearchBox value={search} onChange={setSearch} placeholder="Search projects" />
          <div className="filters">
            <Select value={manager} onChange={setManager} aria-label="Manager">
              <option value={ALL}>All managers</option>
              {managers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
              <option value={UNASSIGNED}>Unassigned</option>
            </Select>
            <Select value={status} onChange={setStatus} aria-label="Status">
              <option value={ALL}>All statuses</option>
              {Object.values(PROJECT_STATUS).map((value) => (
                <option key={value} value={value}>
                  {projectStatusLabel(value)}
                </option>
              ))}
            </Select>
            <Select value={phase} onChange={setPhase} aria-label="Health">
              <option value={ALL}>All health</option>
              {SCHEDULE_PHASES.map((value) => (
                <option key={value} value={value}>
                  {phaseLabel(value)}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {visible.length ? (
          <ProjectTable projects={visible} onOpen={onOpenProject} />
        ) : (
          <EmptyState
            title="No projects found"
            body="Try clearing a filter or using a different search term."
          />
        )}
      </Panel>
    </>
  )
}
