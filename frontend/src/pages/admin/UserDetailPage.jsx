import { ChevronRight } from 'lucide-react'
import { AssignmentList } from '../../components/users/AssignmentList.jsx'
import {
  BackLink,
  Badge,
  Button,
  DetailHero,
  DetailList,
  EmptyState,
  Panel,
} from '../../components/ui'
import { ADMIN_DIALOGS } from './adminConfig.js'

// Prototype sample assignments; the detail text depends on the user's role.
function getAssignments(isManager) {
  return [
    {
      key: 'portal',
      title: 'Customer Portal Rebuild',
      detail: isManager
        ? 'Project manager · 3 employees'
        : 'Design system · Waiting for review',
      trailing: <ChevronRight size={17} />,
    },
    {
      key: 'identity',
      title: 'Identity Platform Upgrade',
      detail: isManager ? 'Completed · Historical' : 'Launch support · Completed',
      trailing: <ChevronRight size={17} />,
    },
  ]
}

/** One user's profile and project assignments. */
export function UserDetailPage({ user, onBack, onOpenDialog }) {
  const isManager = user.role === 'Manager'
  return (
    <>
      <BackLink onClick={onBack}>Back to users</BackLink>
      <DetailHero
        avatarName={user.name}
        badges={
          <>
            <Badge tone={user.role}>{user.role}</Badge>
            <code>{user.id}</code>
          </>
        }
        title={user.name}
        subtitle={`${user.title} · ${user.email}`}
        actions={
          <>
            <Button variant="secondary">Reset password</Button>
            <Button>Edit profile</Button>
          </>
        }
      />
      <div className="overview-grid">
        <Panel
          title="Profile details"
          description="User ID is generated automatically and cannot be edited."
        >
          <DetailList
            items={[
              { label: 'Username', value: user.username },
              { label: 'Email', value: user.email },
              { label: 'Job title', value: user.title },
              { label: 'Role', value: user.role },
              { label: 'Assigned manager', value: user.manager },
              { label: 'Annual salary', value: user.salary },
            ]}
          />
          {user.role === 'Employee' && (
            <Button
              variant="secondary"
              onClick={() => onOpenDialog(ADMIN_DIALOGS.transferEmployee)}
            >
              Transfer manager
            </Button>
          )}
        </Panel>
        <Panel
          title={isManager ? 'Managed projects' : 'Current assignments'}
          description="Project and milestone participation."
        >
          {user.role === 'Admin' ? (
            <EmptyState
              title="No project assignments"
              body="Administrators manage system records but are not assigned to project work."
            />
          ) : (
            <AssignmentList items={getAssignments(isManager)} />
          )}
        </Panel>
      </div>
    </>
  )
}
