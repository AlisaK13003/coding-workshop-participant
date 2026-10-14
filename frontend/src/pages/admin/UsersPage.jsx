import { useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { RoleBadge } from '../../components/users/RoleBadge.jsx'
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  PageHeading,
  Panel,
  PersonCell,
  QueryContent,
  SearchBox,
  Select,
} from '../../components/ui'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'
import { useApiQuery } from '../../hooks/useApiQuery.js'
import { listUsers } from '../../services/usersApi.js'
import { includesText } from '../../utils/text.js'
import { ROLES, roleLabel } from '../../utils/users.js'
import { UserDetailPage } from './UserDetailPage.jsx'

const ALL = ''

const COLUMNS = [
  {
    key: 'name',
    header: 'Name',
    render: (user) => (
      <>
        <PersonCell name={user.name} />
        {user.archived_at && <Badge>Archived</Badge>}
      </>
    ),
  },
  { key: 'username', header: 'Username', render: (user) => user.username },
  { key: 'email', header: 'Email', render: (user) => user.email },
  { key: 'role', header: 'Role', render: (user) => <RoleBadge role={user.role} /> },
  { key: 'title', header: 'Job title', render: (user) => user.job_title },
  { key: 'manager', header: 'Manager', render: (user) => user.manager?.name ?? '—' },
  { key: 'id', header: 'User ID', render: (user) => <code>{user.display_id}</code> },
  { key: 'open', header: '', render: () => <ChevronRight size={17} /> },
]

/** User directory; selecting a row opens that user's detail page. */
export function UsersPage({ projects, onOpenProject, onOpenDialog }) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState(ALL)
  const [managerId, setManagerId] = useState(ALL)
  const [showArchived, setShowArchived] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const users = useApiQuery(
    () => listUsers({ role, manager_id: managerId, include_archived: showArchived ? 'true' : undefined }),
    [role, managerId, showArchived],
  )
  const managers = useApiQuery(() => listUsers({ role: 'manager' }), [])

  if (selectedId) {
    return (
      <UserDetailPage
        userId={selectedId}
        projects={projects}
        onBack={() => setSelectedId(null)}
        onOpenProject={onOpenProject}
        onOpenDialog={onOpenDialog}
      />
    )
  }

  return (
    <>
      <PageHeading
        eyebrow="Directory"
        title="Users"
        description="Manage administrators, managers, employees, reporting lines, and access."
        actions={
          <Button onClick={() => onOpenDialog(DIALOGS.createUser)}>
            <Plus size={16} />
            Create user
          </Button>
        }
      />
      <Panel>
        <div className="toolbar">
          <SearchBox value={search} onChange={setSearch} placeholder="Search name, username, or email" />
          <div className="filters">
            <Select value={role} onChange={setRole} aria-label="Role">
              <option value={ALL}>All roles</option>
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {roleLabel(value)}
                </option>
              ))}
            </Select>
            <Select value={managerId} onChange={setManagerId} aria-label="Manager">
              <option value={ALL}>All managers</option>
              {(managers.data ?? []).map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </Select>
            <Select
              value={showArchived ? 'all' : 'active'}
              onChange={(value) => setShowArchived(value === 'all')}
              aria-label="Archived users"
            >
              <option value="active">Active users</option>
              <option value="all">Including archived</option>
            </Select>
          </div>
        </div>
        <QueryContent query={users} loadingLabel="Loading users…">
          {(rows) => {
            const visible = rows.filter((user) =>
              includesText(`${user.name} ${user.email} ${user.username}`, search),
            )
            return visible.length ? (
              <DataTable
                columns={COLUMNS}
                rows={visible}
                getRowKey={(user) => user.id}
                onRowClick={(user) => setSelectedId(user.id)}
              />
            ) : (
              <EmptyState title="No users found" body="Try clearing a filter or using a different search term." />
            )
          }}
        </QueryContent>
      </Panel>
    </>
  )
}
