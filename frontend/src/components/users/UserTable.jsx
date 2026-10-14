import { ChevronRight } from 'lucide-react'
import { Badge, DataTable, PersonCell } from '../ui'
import { RoleBadge } from './RoleBadge.jsx'

const COLUMNS = {
  name: {
    key: 'name',
    header: 'Name',
    render: (user) => <PersonCell name={user.name} badge={user.archived_at && <Badge>Archived</Badge>} />,
  },
  username: { key: 'username', header: 'Username', render: (user) => user.username },
  email: { key: 'email', header: 'Email', render: (user) => user.email },
  role: { key: 'role', header: 'Role', render: (user) => <RoleBadge role={user.role} /> },
  title: { key: 'title', header: 'Job title', render: (user) => user.job_title },
  manager: { key: 'manager', header: 'Manager', render: (user) => user.manager?.name ?? '—' },
  id: { key: 'id', header: 'User ID', render: (user) => <code>{user.display_id}</code> },
  open: { key: 'open', header: '', render: () => <ChevronRight size={17} /> },
}

const FULL = ['name', 'username', 'email', 'role', 'title', 'manager', 'id', 'open']
const COMPACT = ['name', 'role', 'title', 'manager', 'open']

/**
 * People list; selecting a row calls onOpen(user). `compact` (dashboard) shows fewer columns;
 * `columns` (keys of COLUMNS) picks them exactly.
 */
export function UserTable({ users, onOpen, compact = false, columns = compact ? COMPACT : FULL }) {
  return (
    <DataTable
      columns={columns.map((key) => COLUMNS[key])}
      rows={users}
      getRowKey={(user) => user.id}
      onRowClick={onOpen}
    />
  )
}
