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
import { managerNames } from '../../data/adminData.js'
import { includesText } from '../../utils/text.js'
import { ADMIN_DIALOGS } from './adminConfig.js'
import { ProjectTable } from './ProjectTable.jsx'

const ALL_STATUSES = 'All statuses'
const ALL_PHASES = 'All phases'

/** Searchable, filterable list of every non-archived project. */
export function ProjectsPage({ projects, onOpenProject, onOpenDialog }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(ALL_STATUSES)
  const [phase, setPhase] = useState(ALL_PHASES)
  const visible = projects.filter(
    (project) =>
      !project.archived &&
      includesText(project.name, search) &&
      (status === ALL_STATUSES || project.status === status) &&
      (phase === ALL_PHASES || project.phase === phase),
  )

  return (
    <>
      <PageHeading
        eyebrow="Portfolio"
        title="Projects"
        description="Create projects, manage assignments, and monitor delivery health."
        actions={
          <Button onClick={() => onOpenDialog(ADMIN_DIALOGS.createProject)}>
            <Plus size={16} />
            Create project
          </Button>
        }
      />
      <Panel>
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search projects"
          />
          <div className="filters">
            <Select>
              <option>All managers</option>
              {managerNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
              <option>Unassigned</option>
            </Select>
            <Select value={status} onChange={setStatus}>
              <option>{ALL_STATUSES}</option>
              <option>In progress</option>
              <option>Completed</option>
              <option>Abandoned</option>
            </Select>
            <Select value={phase} onChange={setPhase}>
              <option>{ALL_PHASES}</option>
              <option>Green</option>
              <option>Amber</option>
              <option>Red</option>
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
