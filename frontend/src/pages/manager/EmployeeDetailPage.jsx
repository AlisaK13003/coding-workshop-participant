import { AssignmentList } from '../../components/users/AssignmentList.jsx'
import {
  BackLink,
  Badge,
  Button,
  DetailHero,
  DetailList,
  Panel,
  PanelNote,
} from '../../components/ui'
import { MANAGER_NAME } from '../../data/managerData.js'
import { formatMoney, fullName } from '../../utils/format.js'
import {
  findEmployeeMilestone,
  getMilestoneState,
} from '../../utils/milestones.js'
import { ManagerWorkLogTable } from './ManagerWorkLogTable.jsx'

function getAssignments(employee, projects, milestones) {
  return projects
    .filter((project) => project.employeeIds.includes(employee.id))
    .map((project) => {
      const current = findEmployeeMilestone(milestones, project.id, employee.id)
      return {
        key: project.id,
        title: project.name,
        detail: current?.name || 'Needs milestone assignment',
        trailing: (
          <Badge tone={current ? 'Green' : 'Amber'}>
            {current ? getMilestoneState(current, milestones) : 'Unassigned'}
          </Badge>
        ),
      }
    })
}

/** One direct report: profile, active assignments and visible work logs. */
export function EmployeeDetailPage({
  employee,
  projects,
  milestones,
  logs,
  onBack,
  onEdit,
  onResetPassword,
}) {
  const name = fullName(employee)
  return (
    <>
      <BackLink onClick={onBack}>Back to my employees</BackLink>
      <DetailHero
        avatarName={name}
        badges={
          <>
            <Badge tone="Employee">Employee</Badge>
            <code>{employee.employeeId}</code>
          </>
        }
        title={name}
        subtitle={`${employee.title} · ${employee.email}`}
        actions={
          <>
            <Button variant="secondary" onClick={onResetPassword}>
              Reset password
            </Button>
            <Button onClick={onEdit}>Edit profile</Button>
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
              { label: 'First name', value: employee.first },
              { label: 'Last name', value: employee.last },
              { label: 'Username', value: employee.username },
              { label: 'Email', value: employee.email },
              { label: 'Job title', value: employee.title },
              { label: 'Annual salary', value: formatMoney(employee.salary) },
              { label: 'Reporting manager', value: MANAGER_NAME },
              { label: 'Employee ID', value: <code>{employee.employeeId}</code> },
            ]}
          />
          <PanelNote>
            Salary changes affect future entries only. Historical labor costs
            remain unchanged.
          </PanelNote>
        </Panel>
        <Panel
          title="Active project assignments"
          description="One current milestone per project."
        >
          <AssignmentList items={getAssignments(employee, projects, milestones)} />
        </Panel>
      </div>
      <Panel
        title="Visible work logs"
        description="Hours shown are only for your active projects. Closed-project history is hidden from managers."
      >
        <ManagerWorkLogTable
          logs={logs.filter((log) => log.employeeId === employee.id)}
          employees={[employee]}
          projects={projects}
          milestones={milestones}
        />
      </Panel>
    </>
  )
}
