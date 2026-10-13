import { useState } from 'react'
import { ChevronRight, CircleAlert } from 'lucide-react'
import {
  Badge,
  DataTable,
  PageHeading,
  Panel,
  PersonCell,
  SearchBox,
} from '../../components/ui'
import { fullName } from '../../utils/format.js'
import { includesText } from '../../utils/text.js'
import { getEmployeeOverview } from './managerSelectors.js'
import './MyEmployeesPage.css'

const ATTENTION_TONE = {
  'Needs milestone': 'Amber',
  Waiting: 'Amber',
  Assigned: 'Green',
}

/** Direct reports with their active projects, weekly hours and assignment state. */
export function MyEmployeesPage({
  employees,
  projects,
  milestones,
  logs,
  onSelectEmployee,
}) {
  const [search, setSearch] = useState('')
  const visible = employees.filter((employee) =>
    includesText(`${fullName(employee)} ${employee.email} ${employee.title}`, search),
  )
  const rows = visible.map((employee) => ({
    employee,
    ...getEmployeeOverview(employee, { projects, milestones, logs }),
  }))

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => <PersonCell name={fullName(row.employee)} />,
    },
    { key: 'email', header: 'Email', render: (row) => row.employee.email },
    { key: 'title', header: 'Job title', render: (row) => row.employee.title },
    { key: 'projects', header: 'Active projects', render: (row) => row.activeCount },
    { key: 'hours', header: 'Hours this week', render: (row) => `${row.weekHours} h` },
    {
      key: 'attention',
      header: 'Assignment attention',
      render: (row) => (
        <Badge tone={ATTENTION_TONE[row.attention]}>{row.attention}</Badge>
      ),
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
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search employees"
          />
          <div className="scope-note">
            <CircleAlert size={15} />
            Hours include visible active projects only
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.employee.id}
          onRowClick={(row) => onSelectEmployee(row.employee.id)}
        />
      </Panel>
    </>
  )
}
