import { ChevronRight } from 'lucide-react'
import { AssignmentList } from '../../components/users/AssignmentList.jsx'
import { RoleBadge } from '../../components/users/RoleBadge.jsx'
import {
  ActionMenu,
  BackLink,
  Badge,
  Button,
  DetailHero,
  DetailList,
  EmptyState,
  Panel,
  QueryContent,
} from '../../components/ui'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'
import { useApiQuery } from '../../hooks/useApiQuery.js'
import { useCurrentUser } from '../../hooks/useSession.js'
import { getUser } from '../../services/usersApi.js'
import { formatMoney } from '../../utils/format.js'
import { projectStatusLabel } from '../../utils/projects.js'

/** An employee's current projects, or the projects a manager runs (from the admin's project list). */
function getAssignments(user, projects, onOpenProject) {
  const open = (projectId) => {
    const project = projects.find((item) => item.id === projectId)
    return project ? () => onOpenProject(project) : undefined
  }
  if (user.role === 'employee') {
    return user.projects.map(({ project, milestone }) => ({
      key: project.id,
      title: project.name,
      detail: milestone?.name ?? 'Needs a milestone assignment',
      trailing: <ChevronRight size={17} />,
      onClick: open(project.id),
    }))
  }
  return projects
    .filter((project) => project.manager?.id === user.id)
    .map((project) => ({
      key: project.id,
      title: project.name,
      detail: `${projectStatusLabel(project.status)}${project.archived_at ? ' · Archived' : ''} · ${project.member_count} employees`,
      trailing: <ChevronRight size={17} />,
      onClick: open(project.id),
    }))
}

/** One user's profile and project assignments, with edit, password and archive actions. */
export function UserDetailPage({ userId, projects, onBack, onOpenProject, onOpenDialog }) {
  const me = useCurrentUser()
  const query = useApiQuery(() => getUser(userId), [userId])

  return (
    <>
      <BackLink onClick={onBack}>Back to users</BackLink>
      <QueryContent query={query} loadingLabel="Loading user…">
        {(user) => {
          const open = (kind) => () => onOpenDialog(kind, { user })
          const assignments = getAssignments(user, projects, onOpenProject)
          return (
            <>
              <DetailHero
                avatarName={user.name}
                badges={
                  <>
                    <RoleBadge role={user.role} />
                    {user.archived_at && <Badge>Archived</Badge>}
                    <code>{user.display_id}</code>
                  </>
                }
                title={user.name}
                subtitle={`${user.job_title} · ${user.email}`}
                actions={
                  <>
                    <Button variant="secondary" onClick={open(DIALOGS.resetPassword)}>
                      Reset password
                    </Button>
                    <Button onClick={open(DIALOGS.editUser)}>Edit profile</Button>
                    <ActionMenu
                      items={[
                        user.id !== me.id && {
                          label: user.archived_at ? 'Restore user' : 'Archive user',
                          onClick: open(DIALOGS.archiveUser),
                        },
                      ]}
                    />
                  </>
                }
              />
              <div className="overview-grid">
                <Panel
                  title="Profile details"
                  description="User ID is generated automatically and can’t be edited."
                >
                  <DetailList
                    items={[
                      { label: 'Username', value: user.username },
                      { label: 'Email', value: user.email },
                      { label: 'Job title', value: user.job_title },
                      { label: 'Role', value: <RoleBadge role={user.role} /> },
                      { label: 'Assigned manager', value: user.manager?.name ?? '—' },
                      {
                        label: 'Annual salary',
                        value: user.annual_salary == null ? '—' : formatMoney(user.annual_salary),
                      },
                    ]}
                  />
                  {user.role === 'employee' && !user.archived_at && (
                    <Button variant="secondary" onClick={open(DIALOGS.transferEmployee)}>
                      Transfer manager
                    </Button>
                  )}
                </Panel>
                <Panel
                  title={user.role === 'manager' ? 'Managed projects' : 'Current assignments'}
                  description="Project and milestone participation."
                >
                  {user.role === 'admin' ? (
                    <EmptyState
                      title="No project assignments"
                      body="Administrators manage system records but aren’t assigned to project work."
                    />
                  ) : assignments.length ? (
                    <AssignmentList items={assignments} />
                  ) : (
                    <EmptyState title="No projects" body="This user isn’t on any project right now." />
                  )}
                </Panel>
              </div>
            </>
          )
        }}
      </QueryContent>
    </>
  )
}
