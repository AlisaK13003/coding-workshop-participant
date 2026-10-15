import { useState } from 'react'
import { Plus } from 'lucide-react'
import { UserTable } from '../../components/users/UserTable.jsx'
import {
  Button,
  EmptyState,
  PageHeading,
  PagedList,
  Panel,
  QueryContent,
  SearchBox,
  Select,
} from '../../components/ui'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'
import { useApiQuery } from '../../hooks/useApiQuery.js'
import { listUsers } from '../../services/usersApi.js'
import { includesText } from '../../utils/text.js'
import { ROLE, ROLES, roleLabel } from '../../utils/users.js'
import { UserDetailPage } from './UserDetailPage.jsx'

const ALL = ''
const PAGE_SIZE = 10

/**
 * User directory; selecting a row opens that user's detail page. The open user is kept by
 * AdminApp (selectedId / onSelectUser), so other pages such as the dashboard can open one.
 */
export function UsersPage({ projects, selectedId, onSelectUser, onOpenProject, onOpenDialog }) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState(ALL)
  const [managerId, setManagerId] = useState(ALL)
  const [showArchived, setShowArchived] = useState(false)
  const users = useApiQuery(
    () => listUsers({ role, manager_id: managerId, include_archived: showArchived ? 'true' : undefined }),
    [role, managerId, showArchived],
  )
  const managers = useApiQuery(() => listUsers({ role: ROLE.manager }), [])

  if (selectedId) {
    return (
      <UserDetailPage
        userId={selectedId}
        projects={projects}
        onBack={() => onSelectUser(null)}
        onOpenProject={onOpenProject}
        onOpenUser={(person) => onSelectUser(person.id)}
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
              <PagedList key={`${search}|${role}|${managerId}|${showArchived}`} items={visible} pageSize={PAGE_SIZE}>
                {(pageUsers) => <UserTable users={pageUsers} onOpen={(user) => onSelectUser(user.id)} />}
              </PagedList>
            ) : (
              <EmptyState title="No users found" body="Try clearing a filter or using a different search term." />
            )
          }}
        </QueryContent>
      </Panel>
    </>
  )
}
