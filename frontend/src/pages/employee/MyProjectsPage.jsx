import { useState } from 'react'
import {
  EmptyState,
  PageHeading,
  Panel,
  SearchBox,
  Select,
} from '../../components/ui'
import { includesText } from '../../utils/text.js'
import { ASSIGNMENT_STATE, getAssignmentState } from './employeeSelectors.js'
import { ProjectList } from './ProjectList.jsx'

const ALL_STATES = 'All assignment states'

/** The employee's active projects, searchable and filterable by assignment state. */
export function MyProjectsPage({ projects, milestones, logs, onOpenProject }) {
  const [search, setSearch] = useState('')
  const [state, setState] = useState(ALL_STATES)
  const visible = projects.filter(
    (project) =>
      includesText(project.name, search) &&
      (state === ALL_STATES || getAssignmentState(milestones, project.id) === state),
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
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search projects"
          />
          <Select value={state} onChange={setState}>
            <option>{ALL_STATES}</option>
            {Object.values(ASSIGNMENT_STATE).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Select>
        </div>
        {visible.length ? (
          <ProjectList
            projects={visible}
            milestones={milestones}
            logs={logs}
            onOpen={onOpenProject}
          />
        ) : (
          <EmptyState
            title="No projects found"
            body="Try clearing the search or assignment-state filter."
          />
        )}
      </Panel>
    </>
  )
}
