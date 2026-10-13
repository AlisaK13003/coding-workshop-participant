import { useState } from 'react'
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  PageHeading,
  Panel,
  SearchBox,
  Select,
} from '../../components/ui'
import { formatHours, formatMoney } from '../../utils/format.js'
import { includesText } from '../../utils/text.js'

/** Archived projects, kept for history, with an Unarchive action. */
export function ArchivePage({ projects, onOpenProject, onUnarchive }) {
  const [search, setSearch] = useState('')
  const archived = projects.filter(
    (project) => project.archived && includesText(project.name, search),
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
    {
      key: 'status',
      header: 'Status',
      render: (project) => <Badge tone={project.status}>{project.status}</Badge>,
    },
    {
      key: 'archivedDate',
      header: 'Archived date',
      render: (project) => project.archivedDate,
    },
    {
      key: 'previousManager',
      header: 'Previous manager',
      render: (project) => project.previousManager,
    },
    {
      key: 'hours',
      header: 'Historical hours',
      render: (project) => formatHours(project.hours),
    },
    {
      key: 'cost',
      header: 'Labor cost',
      render: (project) => formatMoney(project.cost),
    },
    {
      key: 'actions',
      header: '',
      render: (project) => (
        <Button variant="secondary" onClick={() => onUnarchive(project)}>
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
        description="Open completed and abandoned projects without losing milestones or work history."
      />
      <Panel>
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search archived projects"
          />
          <Select>
            <option>All statuses</option>
            <option>Completed</option>
            <option>Abandoned</option>
            <option>In progress</option>
          </Select>
        </div>
        <DataTable
          columns={columns}
          rows={archived}
          getRowKey={(project) => project.id}
        />
        {!archived.length && (
          <EmptyState
            title="No archived projects found"
            body="Try a broader search or clear the status filter."
          />
        )}
      </Panel>
    </>
  )
}
