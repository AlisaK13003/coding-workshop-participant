import { ChevronRight } from 'lucide-react'
import { MilestoneStatusBadge } from '../../components/milestones/MilestoneStatusBadge.jsx'
import { AssignmentList } from '../../components/users/AssignmentList.jsx'
import { RoleBadge } from '../../components/users/RoleBadge.jsx'
import {
  BackLink,
  Badge,
  Button,
  DetailHero,
  DetailList,
  EmptyState,
  Panel,
  PanelNote,
  QueryContent,
} from '../../components/ui'
import { DIALOGS } from '../../components/workspace/dialogKinds.js'
import { WorkLogTable } from '../../components/worklogs/WorkLogTable.jsx'
import { useApiQuery } from '../../hooks/useApiQuery.js'
import { getUser } from '../../services/usersApi.js'
import { findById } from '../../utils/collections.js'
import { formatMoney } from '../../utils/format.js'
import { MANAGER_WORK_LOG_COLUMNS } from './managerConfig.js'

/** The employee's memberships on the manager's own active projects. */
function getAssignments(employee, { projects, milestones }, onOpenProject) {
  const visible = employee.projects.filter(({ project }) => findById(projects, project.id))
  return visible.map(({ project, milestone }) => {
    const current = milestone && findById(milestones, milestone.id)
    return {
      key: project.id,
      title: project.name,
      detail: milestone?.name ?? 'Needs a milestone assignment',
      trailing: (
        <>
          {current ? <MilestoneStatusBadge status={current.status} /> : <Badge tone="Amber">Unassigned</Badge>}
          <ChevronRight size={17} />
        </>
      ),
      onClick: () => onOpenProject(project.id),
    }
  })
}

/** One direct report: profile, active assignments and visible work logs. */
export function EmployeeDetailPage({ employeeId, projects, milestones, logs, onBack, onOpenProject, onOpenDialog }) {
  const query = useApiQuery(() => getUser(employeeId), [employeeId])

  return (
    <>
      <BackLink onClick={onBack}>Back to my employees</BackLink>
      <QueryContent query={query} loadingLabel="Loading employee…">
        {(employee) => {
          const assignments = getAssignments(employee, { projects, milestones }, onOpenProject)
          return (
            <>
              <DetailHero
                avatarName={employee.name}
                badges={
                  <>
                    <RoleBadge role={employee.role} />
                    <code>{employee.display_id}</code>
                  </>
                }
                title={employee.name}
                subtitle={`${employee.job_title} · ${employee.email}`}
                actions={
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => onOpenDialog(DIALOGS.resetPassword, { user: employee })}
                    >
                      Reset password
                    </Button>
                    <Button onClick={() => onOpenDialog(DIALOGS.editUser, { user: employee })}>
                      Edit profile
                    </Button>
                  </>
                }
              />
              <div className="overview-grid">
                <Panel
                  title="Profile details"
                  description="Role, reporting manager, and generated employee ID are read-only."
                >
                  <DetailList
                    items={[
                      { label: 'First name', value: employee.first_name },
                      { label: 'Last name', value: employee.last_name },
                      { label: 'Username', value: employee.username },
                      { label: 'Email', value: employee.email },
                      { label: 'Job title', value: employee.job_title },
                      { label: 'Annual salary', value: formatMoney(employee.annual_salary) },
                      { label: 'Reporting manager', value: employee.manager?.name },
                      { label: 'Employee ID', value: <code>{employee.display_id}</code> },
                    ]}
                  />
                  <PanelNote>
                    Salary changes affect future entries only. Historical labor costs stay unchanged.
                  </PanelNote>
                </Panel>
                <Panel title="Active project assignments" description="One current milestone per project.">
                  {assignments.length ? (
                    <AssignmentList items={assignments} />
                  ) : (
                    <EmptyState title="No active projects" body="Add this employee from a project’s People tab." />
                  )}
                </Panel>
              </div>
              <Panel
                title="Visible work logs"
                description="Only your active projects. Closed-project history is hidden from managers."
              >
                <WorkLogTable
                  logs={logs.filter((log) => log.employee.id === employee.id)}
                  columns={MANAGER_WORK_LOG_COLUMNS}
                  emptyBody="No work logged on your active projects yet."
                />
              </Panel>
            </>
          )
        }}
      </QueryContent>
    </>
  )
}
