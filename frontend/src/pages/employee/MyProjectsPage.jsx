import { useState } from 'react'
import {
  EmptyState,
  PageHeading,
  Panel,
  SearchBox,
  Select,
} from '../../components/ui'
import { ASSIGNMENT_STATE } from '../../utils/milestones.js'
import { includesText } from '../../utils/text.js'
import { ProjectList } from './ProjectList.jsx'

/** The employee's active projects, searchable and filterable by assignment state. */
export function MyProjectsPage({ assignments, logs, onOpenProject }) {
  const [search, setSearch] = useState('')
  const [state, setState] = useState('')
  const visible = assignments.filter(
    (item) => includesText(item.project.name, search) && (!state || item.state === state),
  )

  return (
    <>
      <PageHeading
        eyebrow="Your assignments"
        title="My projects"
        description="Active projects you belong to and your current milestone in each."
      />
      <Panel>
        <div className="toolbar">
          <SearchBox value={search} onChange={setSearch} placeholder="Search projects" />
          <Select value={state} onChange={setState} aria-label="Assignment state">
            <option value="">All assignment states</option>
            {Object.values(ASSIGNMENT_STATE).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Select>
        </div>
        {visible.length ? (
          <ProjectList assignments={visible} logs={logs} onOpen={onOpenProject} />
        ) : (
          <EmptyState title="No projects found" body="Try clearing the search or assignment-state filter." />
        )}
      </Panel>
    </>
  )
}
