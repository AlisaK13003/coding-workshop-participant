import { useState } from 'react'
import { ProjectStatusBadge } from '../../components/projects/ProjectStatusBadge.jsx'
import {
  Button,
  DataTable,
  EmptyState,
  PageHeading,
  Panel,
  SearchBox,
  Select,
} from '../../components/ui'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'
import { formatDateTime, formatHours, formatMoney } from '../../utils/format.js'
import { PROJECT_STATUS, projectStatusLabel } from '../../utils/projects.js'
import { includesText } from '../../utils/text.js'

/** Archived projects, kept for history, with an Unarchive action. */
export function ArchivePage({ projects, onOpenProject, onOpenDialog }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const archived = projects.filter(
    (project) =>
      project.archived_at &&
      includesText(project.name, search) &&
      (!status || project.status === status),
  )

  const columns = [
    {
      key: 'name',
      header: 'Project',
      render: (project) => (
        <button className="table-link" onClick={() => onOpenProject(project)}>
          {project.name}
        </button>
      ),
    },
    { key: 'status', header: 'Status', render: (project) => <ProjectStatusBadge status={project.status} /> },
    { key: 'archivedDate', header: 'Archived', render: (project) => formatDateTime(project.archived_at) },
    { key: 'manager', header: 'Manager', render: (project) => project.manager?.name ?? '—' },
    { key: 'hours', header: 'Historical hours', render: (project) => formatHours(project.hours) },
    { key: 'cost', header: 'Labor cost', render: (project) => formatMoney(project.cost) },
    {
      key: 'actions',
      header: '',
      render: (project) => (
        <Button variant="secondary" onClick={() => onOpenDialog(DIALOGS.unarchiveProject, { project })}>
          Unarchive
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeading
        eyebrow="Historical records"
        title="Archive"
        description="Open archived projects without losing milestones or work history."
      />
      <Panel>
        <div className="toolbar">
          <SearchBox value={search} onChange={setSearch} placeholder="Search archived projects" />
          <Select value={status} onChange={setStatus} aria-label="Status">
            <option value="">All statuses</option>
            {Object.values(PROJECT_STATUS).map((value) => (
              <option key={value} value={value}>
                {projectStatusLabel(value)}
              </option>
            ))}
          </Select>
        </div>
        {archived.length ? (
          <DataTable columns={columns} rows={archived} getRowKey={(project) => project.id} />
        ) : (
          <EmptyState
            title="No archived projects found"
            body="Archived projects appear here. Try a broader search or clear the status filter."
          />
        )}
      </Panel>
    </>
  )
}
