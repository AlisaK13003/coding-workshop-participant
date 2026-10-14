import { useState } from 'react'
import { ChevronRight, CircleAlert } from 'lucide-react'
import {
  Badge,
  DataTable,
  EmptyState,
  PageHeading,
  Panel,
  PersonCell,
  SearchBox,
} from '../../components/ui'
import { includesText } from '../../utils/text.js'
import { getEmployeeOverview } from './managerSelectors.js'
import './MyEmployeesPage.css'

const ATTENTION_TONE = {
  'Needs milestone': 'Amber',
  Waiting: 'Amber',
  Assigned: 'Green',
  'No projects': 'neutral',
}

/** Direct reports with their active projects, this week's hours and assignment state. */
export function MyEmployeesPage({ employees, members, logs, onSelectEmployee }) {
  const [search, setSearch] = useState('')
  const rows = employees
    .filter((employee) => includesText(`${employee.name} ${employee.email} ${employee.job_title}`, search))
    .map((employee) => ({ employee, ...getEmployeeOverview(employee, { members, logs }) }))

  const columns = [
    { key: 'name', header: 'Name', render: (row) => <PersonCell name={row.employee.name} /> },
    { key: 'email', header: 'Email', render: (row) => row.employee.email },
    { key: 'title', header: 'Job title', render: (row) => row.employee.job_title },
    { key: 'projects', header: 'Active projects', render: (row) => row.activeCount },
    { key: 'hours', header: 'Hours this week', render: (row) => `${row.weekHours} h` },
    {
      key: 'attention',
      header: 'Assignment attention',
      render: (row) => <Badge tone={ATTENTION_TONE[row.attention]}>{row.attention}</Badge>,
    },
    { key: 'open', header: '', render: () => <ChevronRight size={17} /> },
  ]

  return (
    <>
      <PageHeading
        eyebrow="Direct reports"
        title="My employees"
        description="Profile and assignment information for employees who report to you."
      />
      <Panel>
        <div className="toolbar">
          <SearchBox value={search} onChange={setSearch} placeholder="Search employees" />
          <div className="scope-note">
            <CircleAlert size={15} />
            Hours include your active projects only
          </div>
        </div>
        {rows.length ? (
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.employee.id}
            onRowClick={(row) => onSelectEmployee(row.employee.id)}
          />
        ) : (
          <EmptyState title="No employees found" body="Employees who report to you appear here." />
        )}
      </Panel>
    </>
  )
}
