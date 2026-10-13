import { Plus } from 'lucide-react'
import {
  Badge,
  Button,
  DataTable,
  Panel,
  PersonCell,
  Select,
} from '../../../components/ui'
import { fullName } from '../../../utils/format.js'
import {
  MILESTONE_STATUS,
  findEmployeeMilestone,
  getMilestoneState,
} from '../../../utils/milestones.js'
import { MANAGER_DIALOGS } from '../managerConfig.js'

function getAvailability(current, milestones) {
  if (!current) return { tone: 'Amber', label: 'Needs assignment' }
  return getMilestoneState(current, milestones) === MILESTONE_STATUS.blocked
    ? { tone: 'Amber', label: 'Waiting' }
    : { tone: 'Green', label: 'Available' }
}

/** Project employees with a milestone picker each. items: this project's milestones. */
export function PeopleTab({
  project,
  items,
  milestones,
  employees,
  onOpenDialog,
  onEmployeeMilestone,
}) {
  const projectEmployees = employees.filter((employee) =>
    project.employeeIds.includes(employee.id),
  )
  const openMilestones = items.filter(
    (milestone) => milestone.status !== MILESTONE_STATUS.completed,
  )

  const columns = [
    {
      key: 'name',
      header: 'Employee',
      render: (employee) => <PersonCell name={fullName(employee)} />,
    },
    { key: 'title', header: 'Job title', render: (employee) => employee.title },
    {
      key: 'milestone',
      header: 'Current milestone',
      render: (employee) => (
        <Select
          className="inline-select"
          value={findEmployeeMilestone(items, project.id, employee.id)?.id || ''}
          onChange={(value) =>
            onEmployeeMilestone(employee.id, value ? Number(value) : null)
          }
        >
          <option value="">Unassigned</option>
          {openMilestones.map((milestone) => (
            <option key={milestone.id} value={milestone.id}>
              {milestone.name}
            </option>
          ))}
        </Select>
      ),
    },
    {
      key: 'availability',
      header: 'Availability',
      render: (employee) => {
        const { tone, label } = getAvailability(
          findEmployeeMilestone(items, project.id, employee.id),
          milestones,
        )
        return <Badge tone={tone}>{label}</Badge>
      },
    },
    {
      key: 'actions',
      header: '',
      render: (employee) => (
        <Button
          variant="ghost"
          onClick={() =>
            onOpenDialog(MANAGER_DIALOGS.removeEmployee, {
              employeeId: employee.id,
            })
          }
        >
          Remove
        </Button>
      ),
    },
  ]

  return (
    <Panel
      title="Project people"
      description="Add existing direct reports and assign one milestone per employee in this project."
      actions={
        <Button onClick={() => onOpenDialog(MANAGER_DIALOGS.assignEmployee)}>
          <Plus size={16} />
          Add employee
        </Button>
      }
    >
      <DataTable
        columns={columns}
        rows={projectEmployees}
        getRowKey={(employee) => employee.id}
      />
    </Panel>
  )
}
