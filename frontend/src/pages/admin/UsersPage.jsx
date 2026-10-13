import { useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import {
  Badge,
  Button,
  DataTable,
  PageHeading,
  Panel,
  PersonCell,
  SearchBox,
  Select,
} from '../../components/ui'
import { managerNames, usersSeed } from '../../data/adminData.js'
import { includesText } from '../../utils/text.js'
import { ADMIN_DIALOGS } from './adminConfig.js'
import { UserDetailPage } from './UserDetailPage.jsx'

const ALL_ROLES = 'All roles'

const COLUMNS = [
  { key: 'name', header: 'Name', render: (user) => <PersonCell name={user.name} /> },
  { key: 'username', header: 'Username', render: (user) => user.username },
  { key: 'email', header: 'Email', render: (user) => user.email },
  {
    key: 'role',
    header: 'Role',
    render: (user) => <Badge tone={user.role}>{user.role}</Badge>,
  },
  { key: 'title', header: 'Job title', render: (user) => user.title },
  { key: 'manager', header: 'Manager', render: (user) => user.manager },
  { key: 'id', header: 'User ID', render: (user) => <code>{user.id}</code> },
  { key: 'open', header: '', render: () => <ChevronRight size={17} /> },
]

/** User directory; selecting a row opens that user's detail page. */
export function UsersPage({ onOpenDialog }) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState(ALL_ROLES)
  const [selected, setSelected] = useState(null)

  if (selected) {
    return (
      <UserDetailPage
        user={selected}
        onBack={() => setSelected(null)}
        onOpenDialog={onOpenDialog}
      />
    )
  }

  const visible = usersSeed.filter(
    (user) =>
      includesText(`${user.name} ${user.email} ${user.username}`, search) &&
      (role === ALL_ROLES || user.role === role),
  )

  return (
    <>
      <PageHeading
        eyebrow="Directory"
        title="Users"
        description="Manage administrators, managers, employees, reporting lines, and access."
        actions={
          <Button onClick={() => onOpenDialog(ADMIN_DIALOGS.createUser)}>
            <Plus size={16} />
            Create user
          </Button>
        }
      />
      <Panel>
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search name, username, or email"
          />
          <div className="filters">
            <Select value={role} onChange={setRole}>
              <option>{ALL_ROLES}</option>
              <option>Admin</option>
              <option>Manager</option>
              <option>Employee</option>
            </Select>
            <Select>
              <option>All managers</option>
              {managerNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </Select>
          </div>
        </div>
        <DataTable
          columns={COLUMNS}
          rows={visible}
          getRowKey={(user) => user.id}
          onRowClick={setSelected}
        />
      </Panel>
    </>
  )
}
