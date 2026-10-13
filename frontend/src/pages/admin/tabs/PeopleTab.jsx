import { Plus } from 'lucide-react'
import {
  Badge,
  Button,
  DataTable,
  Panel,
  PersonCell,
} from '../../../components/ui'
import { projectPeople } from '../../../data/adminData.js'

const COLUMNS = [
  {
    key: 'name',
    header: 'Employee',
    render: (person) => <PersonCell name={person.name} />,
  },
  { key: 'title', header: 'Job title', render: (person) => person.title },
  { key: 'manager', header: 'Manager', render: (person) => person.manager },
  {
    key: 'milestone',
    header: 'Current milestone',
    render: (person) => person.milestone,
  },
  {
    key: 'workState',
    header: 'Work state',
    render: (person) => (
      <Badge tone={person.workState.includes('Waiting') ? 'Amber' : 'Green'}>
        {person.workState}
      </Badge>
    ),
  },
  {
    key: 'actions',
    header: '',
    render: () => <Button variant="ghost">Manage</Button>,
  },
]

/** Employees assigned to the project and their current milestone. */
export function PeopleTab() {
  return (
    <Panel
      title="Project people"
      description="Eligible employees report to this project’s manager. Changing managers may make assignments incompatible."
      actions={
        <Button>
          <Plus size={16} />
          Add employees
        </Button>
      }
    >
      <DataTable
        columns={COLUMNS}
        rows={projectPeople}
        getRowKey={(person) => person.name}
      />
    </Panel>
  )
}
